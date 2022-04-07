import { useState, useEffect } from "react";
import Link from "next/link";
import {
  useAddress,
  useDisconnect,
  useMetamask,
  useNFTDrop,
} from "@thirdweb-dev/react";
import { GetServerSideProps } from "next";
import { sanityClient, urlFor } from "../../sanity";
import { Collection } from "../../typings";
import { BigNumber } from "ethers";
import toast, { Toaster } from "react-hot-toast";

interface Props {
  collection: Collection;
}

function NFTDropPage({ collection }: Props) {
  const [claimedSupply, setClaimedSupply] = useState<number>(0);
  const [totalSupply, setTotalSupply] = useState<BigNumber>();
  const nftDrop = useNFTDrop(collection.address);
  const [loading, setLoading] = useState<boolean>(true);
  const [priceInEth, setPriceInEth] = useState<string>();

  //Authentications
  const connectWithMetamask = useMetamask();
  const address = useAddress();
  const disConnect = useDisconnect();

  // -------

  useEffect(() => {
    if (!nftDrop) return;

    const fetchPrice = async () => {
      const claimedConditions = await nftDrop.claimConditions.getAll();

      setPriceInEth(claimedConditions?.[0].currencyMetadata.displayValue);
    };

    fetchPrice();
  }, [nftDrop]);

  useEffect(() => {
    if (!nftDrop) return;

    const fetchNFTDropData = async () => {
      setLoading(true);
      const claimed = await nftDrop.getAllClaimed();
      const total = await nftDrop.totalSupply();

      setClaimedSupply(claimed.length);
      setTotalSupply(total);

      setLoading(false);
    };

    fetchNFTDropData();
  }, [nftDrop]);

  const mintNFT = () => {
    if (!nftDrop || !address) return;

    const quantity = 1;

    setLoading(true);

    const notification = toast.loading("Minting...", {
      style: {
        background: "white",
        fontWeight: "bolder",
        padding: "20px",
        fontSize: "17px",
        color: "green",
      },
    });

    nftDrop
      ?.claimTo(address, quantity)
      .then(async (tx) => {
        const receipt = tx[0].receipt; // Get the transaction receipt
        const claimedTokenId = await tx[0].id; // Get the claimed NFT id
        const claimedNFT = await tx[0].data(); // Get claimed NFT metadata

        toast("HOORAY.. You Successfull Minted!", {
          style: {
            background: "white",
            fontWeight: "bolder",
            padding: "20px",
            fontSize: "17px",
            color: "green",
          },
        });

        console.log(receipt);
        console.log(claimedTokenId);
        console.log(claimedNFT);
      })
      .catch((err) => {
        console.log(err);
        toast("Whoops... Something went wrong!", {
          style: {
            background: "whredte",
            fontWeight: "bolder",
            padding: "20px",
            fontSize: "17px",
            color: "white",
          },
        });
      })
      .finally(() => {
        setLoading(false);
        toast.dismiss(notification);
      });
  };

  // console.log(address);

  return (
    <div className="flex h-screen flex-col lg:grid lg:grid-cols-10">
      <Toaster position="bottom-center" />
      <div className="lg:col-span-4 bg-gradient-to-br from-cyan-800 to-rose-500">
        <div className="flex flex-col items-center justify-center py-2 lg:min-h-screen">
          <div className="bg-gradient-to-br from-yellow-600 to-purple-600 p-2 rounded-xl">
            <img
              className="w-44 rounded-xl object-cover lg:h-96 lg:w-72"
              src={urlFor(collection.previewImage).url()}
              alt="ape"
            />
          </div>

          <div className="text-center p-5 space-y-2">
            <h1 className="text-4xl font-bold text-white">
              {collection.nftCollectionName}
            </h1>
            <h2 className="text-xl text-gray-300">{collection.description}</h2>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-12 lg:col-span-6">
        {/* Header */}
        <header className="flex items-center justify-between">
          <Link href={"/"}>
            <h1 className="w-52 cursor-pointer text-xl font-extralight sm:w-80">
              The{" "}
              <span className="font-extrabold underline decoration-pink-600/50">
                PAPAFAM
              </span>{" "}
              NFT Marketplace
            </h1>
          </Link>
          <button
            onClick={() => (address ? disConnect() : connectWithMetamask())}
            className="bg-rose-400 px-4 rounded-full py-2 text-xs font-bold text-white lg:px-5 lg:py-3"
          >
            {address ? "Sign Out" : "Sign In"}
          </button>
        </header>

        <hr className="my-2 border" />
        {address && (
          <p className="text-center text-sm text-gray-400">
            You are logged in with wallet{" "}
            <span className="text-rose-400">
              {address.substring(0, 6)}...
              {address.substring(address.length - 5)}
            </span>
          </p>
        )}

        {/* Content */}
        <div className="mt-10 flex flex-1 flex-col items-center spce-y-6 text-center lg:space-y-0 lg:justify-center">
          <img
            className="w-80 object-cover pb-10 lg:h-40"
            src={urlFor(collection.mainImage).url()}
            alt=""
          />
          <h1 className="text-3xl font-bold lg:text-5xl text-extrabold">
            {collection.title}
          </h1>

          {loading ? (
            <p className="animate-pulse pt-2 text-xl text-green-500">
              Loading Supply Count
            </p>
          ) : (
            <p className="pt-2 text-xl text-green-500">
              {claimedSupply} / {totalSupply?.toString()} NFT&apos;s
            </p>
          )}

          {loading && (
            <img
              className="h-80 w-80 object-contain"
              src="https://cdn.hackernoon.com/images/0*4Gzjgh9Y7Gu8KEtZ.gif"
              alt=""
            />
          )}
        </div>

        <button
          onClick={mintNFT}
          disabled={
            loading || claimedSupply === totalSupply?.toNumber() || !address
          }
          className="h-16 font-bold bg-red-600 w-full text-white rounded-full disabled:bg-gray-400"
        >
          {loading ? (
            <>Loading</>
          ) : claimedSupply === totalSupply?.toNumber() ? (
            <>Sold Out</>
          ) : !address ? (
            <>Sign in to Mint</>
          ) : (
            <span className="font-bold">Mint NFT ({priceInEth} ETH)</span>
          )}
        </button>
      </div>
    </div>
  );
}

export default NFTDropPage;

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  const query = `*[_type == "collection" && slug.current == $id][0]{
    _id,
    title,
    address,
    description,
    nftCollectionName,
    mainImage{
      asset
    },
    previewImage{
      asset
    },
    slug {
      current
    },
    creator-> {
      _id,
      name,
      address,
      slug {
        current
      },
    },
  }`;

  const collection = await sanityClient.fetch(query, {
    id: params?.id,
  });

  if (!collection) {
    return {
      notFound: true,
    };
  }

  return {
    props: {
      collection,
    },
  };
};
