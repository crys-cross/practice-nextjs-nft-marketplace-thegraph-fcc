import type { NextPage } from "next"
import { useEffect, useState } from "react"
import { useWeb3Contract, useMoralis } from "react-moralis"
import nftMarketplaceAbi from "../constants/NftMarketplace.json"
import nftAbi from "../constants/BasicNft.json"
import Image from "next/image" //can't be used on static sites
import { Card, Tooltip, Illustration, Modal, Input, Button, useNotification } from "web3uikit"
import { ethers } from "ethers"
import { UpdateListingModal } from "./UpdateListingModals"
import { SellNFTModal } from "./SellNFTModal"

interface NFTBoxProps {
    price?: number
    nftAddress: string
    tokenId: string
    nftMarketplaceAddress: string
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
    nftMarketplaceAddress,
    seller,
}: NFTBoxProps) => {
    console.log(nftMarketplaceAddress)
    const dispatch = useNotification()
    const { chainId, isWeb3Enabled, account } = useMoralis()
    const [imageURI, setimageURI] = useState<string | undefined>()
    const [tokenName, settokenName] = useState<string | undefined>()
    const [tokenDescription, settokenDescription] = useState<string | undefined>()
    const [showModal, setShowmModal] = useState(false)
    const hideModal = () => setShowmModal(false)
    const isListed = seller != undefined
    console.log(`marketplace: ${nftMarketplaceAddress}`)

    const { runContractFunction: getTokenURI, data: tokenURI } = useWeb3Contract({
        abi: nftAbi,
        contractAddress: nftAddress,
        functionName: "tokenURI",
        params: {
            tokenId: tokenId,
        },
    })

    const { runContractFunction: buyItem, error: buyError } = useWeb3Contract({
        abi: nftMarketplaceAbi,
        contractAddress: nftMarketplaceAddress,
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
        console.log(`The tokenURI is ${tokenURI}`)
        if (tokenURI) {
            // use IPFS Gateway(since not every browser is IPFS compatible): a server that will return IPFS files from a "normal" URL.
            const requestURL = (tokenURI as string).replace("ipfs://", "https://ipfs.io/ipfs/")
            const tokenURIResponse = await (await fetch(requestURL)).json() //fetch used in JS to fetch or get URL. await to get url then await to convert to json
            const imageURI = tokenURIResponse.image
            const imageURIURL = (imageURI as string).replace("ipfs://", "https://ipfs.io/ipfs/")
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
        updateUI()
    }, [tokenURI])

    useEffect(() => {
        if (isWeb3Enabled) {
            updateUI()
        }
    }, [isWeb3Enabled])

    const isOwnedByUser = seller === account || seller === undefined
    const formattedSellerAddress = isOwnedByUser ? "you" : truncateStr(seller || "", 15)

    const handleCardClick = async () => {
        if (isOwnedByUser) {
            setShowmModal(true)
        } else {
            console.log(nftMarketplaceAddress)
            await buyItem({
                onError: (error) => console.log(error),
                onSuccess: () => handleBuyItemSuccess(),
            })
        }
    }

    const handleBuyItemSuccess = () => {
        dispatch({
            type: "success",
            message: "Item Bought",
            title: "Item Bought",
            position: "topR",
        })
    }

    const tooltipContent = isListed
        ? isOwnedByUser
            ? "Update listing"
            : "Buy me"
        : "Create listing"

    return (
        <div className="p-2">
            <SellNFTModal
                isVisible={showModal && !isListed}
                imageURI={imageURI}
                nftAbi={nftAbi}
                nftMarketplaceAbi={nftMarketplaceAbi}
                nftAddress={nftAddress}
                tokenId={tokenId}
                onClose={hideModal}
                nftMarketplaceAddress={nftMarketplaceAddress}
            />
            <UpdateListingModal
                isVisible={showModal && isListed}
                imageURI={imageURI}
                nftMarketplaceAbi={nftMarketplaceAbi}
                nftAddress={nftAddress}
                tokenId={tokenId}
                onClose={hideModal}
                nftMarketplaceAddress={nftMarketplaceAddress}
                currentPrice={price}
            />
            <Card title={tokenName} description={tokenDescription} onClick={handleCardClick}>
                <Tooltip content={tooltipContent} position="top">
                    <div className="p-2">
                        {imageURI ? (
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
                                {price && (
                                    <div className="font-bold">
                                        {ethers.utils.formatEther(price)} ETH
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-1">
                                <Illustration height="180px" logo="lazyNft" width="100%" />
                                Loading...
                            </div>
                        )}
                    </div>
                </Tooltip>
            </Card>
        </div>
    )
}

export default NFTBox
