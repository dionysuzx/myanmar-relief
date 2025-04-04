"use client";

import { useCallback, useState } from "react";
import { Input } from "../components/ui/input";
import { Button } from "~/components/ui/Button";
import { Label } from "~/components/ui/label";
import { useFrame } from "~/components/providers/FrameProvider";
import {
  useAccount,
  useConnect,
  useWriteContract,
  useWaitForTransactionReceipt,
  useChainId,
  useSwitchChain,
} from "wagmi";
import { config } from "~/components/providers/WagmiProvider";
import { base } from "wagmi/chains";
import { truncateAddress } from "~/lib/truncateAddress";
import { parseUnits } from "viem";
import { BaseError, UserRejectedRequestError } from "viem";
import sdk from "@farcaster/frame-sdk";

// USDC on Base
const USDC_CONTRACT_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
// Donation recipient address
const DONATION_ADDRESS = "0xa52820d251b38d6e3bd5739f4fd6fa32e7d125f3";
// Learn more URL
const LEARN_MORE_URL = "https://www.buddhistglobalrelief.org/myanmar-crisis";

// Simple ERC20 ABI for transfer function
const ERC20_ABI = [
  {
    constant: false,
    inputs: [
      { name: "_to", type: "address" },
      { name: "_value", type: "uint256" },
    ],
    name: "transfer",
    outputs: [{ name: "", type: "bool" }],
    payable: false,
    stateMutability: "nonpayable",
    type: "function",
  },
];

// Predefined donation amounts in USDC
const DONATION_AMOUNTS = [1, 5, 10, 20];

export default function Demo({ title }: { title?: string } = { title: "Myanmar Relief" }) {
  const { isSDKLoaded, context } = useFrame();
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { connect } = useConnect();
  
  const [selectedAmount, setSelectedAmount] = useState(5); // Default 5 USDC
  const [customAmount, setCustomAmount] = useState("");
  const [isCustom, setIsCustom] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);

  const { 
    writeContractAsync, 
    isPending: isSendTxPending,
    error: sendTxError,
    isError: isSendTxError
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash: txHash as `0x${string}`,
    });

  const {
    switchChain,
    error: switchChainError,
    isError: isSwitchChainError,
  } = useSwitchChain();

  const handleSwitchToBase = useCallback(() => {
    if (chainId !== base.id) {
      switchChain({ chainId: base.id });
    }
  }, [switchChain, chainId]);
  
  const handleLearnMore = useCallback(() => {
    sdk.actions.openUrl(LEARN_MORE_URL);
  }, []);

  const handleDonation = useCallback(async () => {
    if (!isConnected) {
      connect({ connector: config.connectors[0] });
      return;
    }

    if (chainId !== base.id) {
      handleSwitchToBase();
      return;
    }
    const amount = isCustom ? customAmount : selectedAmount.toString();
    if (!amount || Number.parseFloat(amount) <= 0) {
      return;
    }

    try {
      // Convert amount to USDC with 6 decimals
      const amountInWei = parseUnits(amount, 6);
      
      const hash = await writeContractAsync({
        abi: ERC20_ABI,
        address: USDC_CONTRACT_ADDRESS,
        functionName: "transfer",
        args: [DONATION_ADDRESS, amountInWei],
      });
      
      setTxHash(hash);
    } catch (error) {
      console.error("Transaction error:", error);
    }
  }, [
    isConnected, 
    connect, 
    chainId, 
    handleSwitchToBase, 
    isCustom, 
    customAmount, 
    selectedAmount, 
    writeContractAsync
  ]);

  const handleSelectAmount = (amount: number) => {
    setSelectedAmount(amount);
    setIsCustom(false);
  };

  const handleCustomAmount = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomAmount(e.target.value);
    setIsCustom(true);
  };

  if (!isSDKLoaded) {
    return <div>Loading...</div>;
  }

  return (
    <div
      style={{
        paddingTop: context?.client.safeAreaInsets?.top ?? 0,
        paddingBottom: context?.client.safeAreaInsets?.bottom ?? 0,
        paddingLeft: context?.client.safeAreaInsets?.left ?? 0,
        paddingRight: context?.client.safeAreaInsets?.right ?? 0,
      }}
    >
      <div className="w-[300px] mx-auto py-4 px-4">
        <h1 className="text-2xl font-bold text-center mb-4 text-black dark:text-white">{title}</h1>
        <p className="text-center mb-6 text-black dark:text-gray-300" style={{ color: 'inherit' }}>
          Support Myanmar with a USDC donation on Base
        </p>

        <div className="mb-6">
          <div className="grid grid-cols-4 gap-2 mb-4">
            {DONATION_AMOUNTS.map((amount) => (
              <button
                key={amount}
                onClick={() => handleSelectAmount(amount)}
                className={`p-2 rounded-lg border ${
                  !isCustom && selectedAmount === amount
                    ? "bg-[#7C65C1] text-white border-[#7C65C1]"
                    : "bg-white border-gray-300 hover:border-[#7C65C1] text-black"
                }`}
                type="button"
              >
                ${amount}
              </button>
            ))}
          </div>

          <div className="mb-4">
            <Label htmlFor="custom-amount" className="text-sm font-medium text-black dark:text-white">
              Custom Amount (USDC)
            </Label>
            <div className="relative mt-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-black dark:text-white">$</span>
              <Input
                id="custom-amount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="Enter amount"
                value={customAmount}
                onChange={handleCustomAmount}
                className="pl-7"
              />
            </div>
          </div>
        </div>

        {chainId !== base.id && isConnected && (
          <div className="text-amber-600 text-center mb-4">
            Please switch to Base network
          </div>
        )}

        <Button
          onClick={handleDonation}
          disabled={isSendTxPending || isConfirming}
          isLoading={isSendTxPending || isConfirming}
        >
          {chainId !== base.id && isConnected
            ? "Switch to Base"
            : `Donate ${isCustom ? `$${customAmount}` : `$${selectedAmount}`} USDC`}
        </Button>
        <div className="text-center mt-3">
          <button 
            type="button"
            onClick={handleLearnMore}
            className="text-[#7C65C1] hover:underline text-sm"
          >
            Learn more about this relief effort
          </button>
        </div>

        {isSendTxError && renderError(sendTxError)}
        {isSwitchChainError && renderError(switchChainError)}

        {txHash && (
          <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
            {isConfirmed ? (
              <>
                <div className="text-green-600 dark:text-green-400 font-medium mb-1">Thank you for your donation!</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Transaction: {truncateAddress(txHash)}
                </div>
              </>
            ) : (
              <>
                <div className="mb-1 text-black dark:text-white">Transaction in progress...</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Hash: {truncateAddress(txHash)}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const renderError = (error: Error | null) => {
  if (!error) return null;
  if (error instanceof BaseError) {
    const isUserRejection = error.walk(
      (e) => e instanceof UserRejectedRequestError
    );

    if (isUserRejection) {
      return <div className="text-red-500 text-xs mt-1">Rejected by user.</div>;
    }
  }

  return <div className="text-red-500 text-xs mt-1">{error.message}</div>;
};