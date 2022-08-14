import { Modal, Input, useNotification } from "web3uikit"
import { useState } from "react"
import { useWeb3Contract } from "react-moralis"
import nftMarketplaceAbi from "../constants/NftMarketplace.json"
import { ethers } from "ethers"

export interface UpdateListingModalProps {
    isVisible: boolean
    onClose: () => void
    // nftMarketplaceAbi: object
    marketplaceAddress: string
    nftAddress: string
    tokenId: string
    // imageURI: string | undefined
    // currentPrice: number | undefined
}

export const UpdateListingModal = ({
    isVisible,
    onClose,
    marketplaceAddress,
    nftAddress,
    tokenId,
}: UpdateListingModalProps) => {
    const dispatch = useNotification()

    const [priceToUpdateListingWith, setPriceToUpdateListingWith] = useState(0)

    const handleUpdateListingSuccess = async () => {
        // await tx.wait(1)
        dispatch({
            type: "success",
            message: "Listing Updated",
            title: "Listing updated - please refresh (and move blocks)",
            position: "topR",
        })
        onClose && onClose()
        setPriceToUpdateListingWith(0)
    }

    const { runContractFunction: updateListing } = useWeb3Contract({
        abi: nftMarketplaceAbi,
        contractAddress: marketplaceAddress,
        functionName: "updateListing",
        params: {
            nftAddress: nftAddress,
            tokenId: tokenId,
            newPrice: ethers.utils.parseEther(priceToUpdateListingWith.toString()),
        },
    })

    return (
        <Modal
            isVisible={isVisible}
            onCancel={onClose}
            onCloseButtonPressed={onClose}
            onOk={() =>
                updateListing({
                    onError: (error) => console.log(error),
                    onSuccess: () => handleUpdateListingSuccess(),
                })
            }
        >
            <Input
                label="Update listing price in L1 currency (ETH)"
                name="New listing price"
                type="number"
                onChange={(event) => {
                    setPriceToUpdateListingWith(Number(event.target.value))
                }}
            />
        </Modal>
    )
}
