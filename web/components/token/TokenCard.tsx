"use client";

import { Token } from "@/lib/hooks/useTokens";
import { formatAddress, formatRole, formatAmount } from "@/lib/utils/format";
import { formatDistance } from "date-fns";

interface TokenCardProps {
  token: Token;
  onTransfer?: (token: Token) => void;
}

export function TokenCard({ token, onTransfer }: TokenCardProps) {
  const normalizeStatus = (status: any): string => {
    if (typeof status === "object" && status) {
      return Object.keys(status)[0];
    }
    return status || "";
  };

  const getStatusColor = (status: any) => {
    const statusStr = normalizeStatus(status);
    switch (statusStr) {
      case "created":
        return "bg-green-100 text-green-800";
      case "inTransfer":
        return "bg-yellow-100 text-yellow-800";
      case "accepted":
        return "bg-gray-200 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: any) => {
    const statusStr = normalizeStatus(status);
    return statusStr ? statusStr.charAt(0).toUpperCase() + statusStr.slice(1) : "Unknown";
  };

  return (
    <div className="bg-white border-4 border-black rounded-lg p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{token.metadata}</h3>
          <p className="text-sm text-gray-500">
            Mint: {formatAddress(token.mint.toString())}
          </p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(token.status)}`}>
          {getStatusLabel(token.status)}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-xs text-gray-500">Creator</p>
          <p className="text-sm font-medium text-gray-900">
            {formatAddress(token.creator.toString())}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Creator Role</p>
          <p className="text-sm font-medium text-gray-900">
            {formatRole(token.creatorRole)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Current Owner</p>
          <p className="text-sm font-medium text-gray-900">
            {formatAddress(token.currentOwner.toString())}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Amount</p>
          <p className="text-sm font-medium text-gray-900">
            {formatAmount(token.amount)}
          </p>
        </div>
      </div>

      {token.sourceTokens.length > 0 && (
        <div className="mb-4 p-3 bg-gray-50 rounded">
          <p className="text-xs text-gray-500 mb-1">Source Tokens ({token.sourceTokens.length})</p>
          <div className="text-xs text-black">
            {token.sourceTokens.map((src) => (
              <div key={src.toString()}>{formatAddress(src.toString())}</div>
            ))}
          </div>
        </div>
      )}

      <div className="text-xs text-gray-500">
        Created {formatDistance(new Date(token.createdAt * 1000), new Date(), { addSuffix: true })}
      </div>

      {onTransfer && (
        <button
          onClick={() => onTransfer(token)}
          disabled={normalizeStatus(token.status) !== "created"}
          className="mt-4 w-full bg-black hover:bg-gray-800 disabled:bg-gray-400 text-white font-semibold py-2 rounded-lg transition"
        >
          Transfer
        </button>
      )}
    </div>
  );
}
