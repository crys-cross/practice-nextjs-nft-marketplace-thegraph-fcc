import type { NextPage } from "next"
import styles from "../styles/Home.module.css"
import { useMoralisQuery, useMoralis } from "react-moralis"
import NFTBox from "../components/NFTBox"

const Home: NextPage = () => {
    //how do we show the recently listed NFTs?
    //we will index the events off-chain and then read from our database
    //setup server to listen for those events to be fired, and we will add them to a database to query
    //Woah, isn't that centralized?
    //TheGraph does this in a decentralized way
    //Moralis does it in a centralized way and comes with a ton of other feature

    //all our logic is still 100% on chain
    //speed and development time
    //its really hard to start a prod blockchain project 100% decentralized
    //they are working on opensourcing their code
    //feature richness
    //we can create more features with a centralized back end to start
    // as more decentralized tools are being created
    //local development
    const { isWeb3Enabled } = useMoralis()
    const { data: listedNfts, isFetching: fetchingListedNfts } = useMoralisQuery(
        //2 parameters(tableName, function for the query)
        "ActivItem",
        (query) => {
            query.limit(10).descending("tokenId")
        }
    )
    console.log(listedNfts)

    return (
        <div className="container mx-auto">
            <h1 className="py-4 px-4 font-bold text-2xl">Recently Listed</h1>
            <div className="flex flex-wrap">
                {isWeb3Enabled ? (
                    fetchingListedNfts ? (
                        <div>Loading...</div>
                    ) : (
                        listedNfts.map((nft /*, index */) => {
                            console.log(nft.attributes)
                            const { price, nftAddress, tokenId, marketplaceAddress, seller } =
                                nft.attributes

                            return (
                                <NFTBox
                                    price={price}
                                    nftAddress={nftAddress}
                                    tokenId={tokenId}
                                    marketplaceAddress={marketplaceAddress}
                                    seller={seller}
                                    key={"${nftAddress}${tokenId}"}
                                />
                            )
                        })
                    )
                ) : (
                    <div>Web3 Currently Not Enabled</div>
                )}
            </div>
        </div>
    )
}

export default Home
