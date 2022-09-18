import type { NextPage } from "next"
import { useEffect, useState } from "react"
import { useWeb3Contract, useMoralis } from "react-moralis"
import nftMarketplaceAbi from "../constants/NftMarketplace.json"
import nftAbi from "../constants/BasicNft.json"
import Image from "next/image" //can't be used on static sites
import { Card, Tooltip, Illustration, Modal, Input, Button, useNotification } from "web3uikit"
import { ethers } from "ethers"
import { UpdateListingModal } from "./UpdateListingModals"

interface NFTBoxProps {
    price?: number
    nftAddress: string
    tokenId: string
    marketplaceAddress: string
    seller?: string
}

const truncateStr = (fullStr: string, strLen: number) => {
    if (fullStr.length <= strLen) return fullStr

    const separator = "..."
    const separatorLength = separator.length
    const charsToShow = strLen - separatorLength
    const frontChars = Math.ceil(charsToShow / 2)
    const backChars = Math.floor(charsToShow / 2)
    return (
        fullStr.substring(0, frontChars) +
        separator +
        fullStr.substring(fullStr.length - backChars)
    )
}

const NFTBox: NextPage<NFTBoxProps> = ({
    price,
    nftAddress,
    tokenId,
    marketplaceAddress,
    seller,
}: NFTBoxProps) => {
    //call the token URi and then call the image uri to show the image(2 api request)
    //then save image as a state variable in this component
    const dispatch = useNotification()
    const { isWeb3Enabled, account } = useMoralis()
    const [imageURI, setimageURI] = useState("")
    const [tokenName, settokenName] = useState("")
    const [tokenDescription, settokenDescription] = useState("")
    const [showModal, setShowmModal] = useState(false)
    const hideModal = () => {
        setShowmModal(false)
    }

    const { runContractFunction: getTokenURI } = useWeb3Contract({
        abi: nftMarketplaceAbi,
        contractAddress: nftAddress,
        functionName: "tokenURI",
        params: {
            tokenId: tokenId,
        },
    })

    const { runContractFunction: buyItem } = useWeb3Contract({
        abi: nftAbi,
        contractAddress: marketplaceAddress,
        functionName: "buyItem",
        msgValue: price,
        params: {
            nftAddress: nftAddress,
            tokenId: tokenId,
        },
    })

    const updateUI = async () => {
        // get the tokenURI
        // using the image tag from the tokenURI, get the image
        const tokenURI = await getTokenURI()
        console.log("The tokenURI is ${tokenURI}")
        if (tokenURI) {
            // use IPFS Gateway(since not every browser is IPFS compatible): a server that will return IPFS files from a "normal" URL.
            const requestURL = (tokenURI as string).replace("ipfs://", "https://ipfs.io/ipfs/")
            const tokenURIResponse = await (await fetch(requestURL)).json() //fetch used in JS to fetch or get URL. await to get url then await to convert to json
            const imageURI = tokenURIResponse.image
            const imageURIURL = imageURI.replace("ipfs://", "https://ipfs.io/ipfs/")
            setimageURI(imageURIURL)
            //other ways to do this
            //We could render the image on our server, and just call our server(since using moralis)
            //For testnets and Mainnet-> use moralis server hooks(ex. useNFTBalance())
            //have the world adopt ipfs
            settokenName(tokenURIResponse.name)
            settokenDescription(tokenURIResponse.description)
        }
    }
    useEffect(() => {
        if (isWeb3Enabled) {
            updateUI()
        }
    }, [isWeb3Enabled])

    const isOwnedbyUser = seller === account || seller === undefined
    const formattedSellerAddress = isOwnedbyUser ? "you" : truncateStr(seller || "", 15)

    const handleCardClick = () => {
        isOwnedbyUser
            ? setShowmModal(true)
            : buyItem({
                  onError: (error) => console.log(error),
                  onSuccess: () => handleBuyItemSuccess(),
              })
    }

    const handleBuyItemSuccess = () => {
        dispatch({
            type: "success",
            message: "Item Bought",
            title: "Item Bought",
            position: "topR",
        })
    }

    return (
        <div>
            <div>
                {imageURI ? (
                    <div>
                        <UpdateListingModal
                            isVisible={showModal}
                            tokenId={tokenId}
                            marketplaceAddress={marketplaceAddress}
                            nftAddress={nftAddress}
                            onClose={hideModal}
                        />
                        <Card
                            title={tokenName}
                            description={tokenDescription}
                            onClick={handleCardClick}
                        >
                            <div className="p-2">
                                <div className="flex flex-col items-end gap-2">
                                    <div>#{tokenId}</div>
                                    <div className="italic text-sm">
                                        Owned by {formattedSellerAddress}
                                    </div>
                                    <Image
                                        loader={() => imageURI}
                                        src={imageURI}
                                        height="200"
                                        width="200"
                                    />
                                    <div className="font-bold">
                                        {ethers.utils.formatUnits(price!, "ether")} ETH
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>
                ) : (
                    <div>Loading...</div>
                )}
            </div>
        </div>
    )
}

export default NFTBox
