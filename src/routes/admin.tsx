import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "beachwoodcafe.vercel.app" },
      { name: "robots", content: "noindex, nofollow" },
    ],
    links: [
      {
        rel: "icon",
        type: "image/svg+xml",
        href: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none'%3E%3Cpath d='M4 3h11l5 5v13H4V3z' stroke='%239aa0a6' stroke-width='2'/%3E%3Cpath d='M15 3v5h5' stroke='%239aa0a6' stroke-width='2'/%3E%3Crect x='8' y='11' width='2' height='2' fill='%239aa0a6'/%3E%3Crect x='14' y='11' width='2' height='2' fill='%239aa0a6'/%3E%3Cpath d='M9 17c1.5-1.5 4.5-1.5 6 0' stroke='%239aa0a6' stroke-width='2'/%3E%3C/svg%3E",
      },
    ],
  }),
  component: ChromeNetErrorPage,
});

function ChromeNetErrorPage() {
  const [hostname, setHostname] = useState("beachwoodcafe.vercel.app");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const host = window.location.host || window.location.hostname || "beachwoodcafe.vercel.app";
      setHostname(host);
      document.title = host;
    }
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 999999,
        backgroundColor: "#202124",
        color: "#9aa0a6",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "24px",
        boxSizing: "border-box",
        userSelect: "text",
        overflow: "auto",
      }}
    >
      <div style={{ maxWidth: "560px", width: "100%", margin: "0 auto", textAlign: "left" }}>
        {/* Sad document icon matching Image 2 */}
        <div style={{ marginBottom: "20px" }}>
          <svg
            width="44"
            height="44"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ display: "block" }}
          >
            <path
              d="M4 3H15L20 8V21H4V3Z"
              stroke="#9aa0a6"
              strokeWidth="1.75"
              strokeLinejoin="round"
            />
            <path
              d="M15 3V8H20"
              stroke="#9aa0a6"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <rect x="8" y="11" width="1.8" height="1.8" fill="#9aa0a6" />
            <rect x="14" y="11" width="1.8" height="1.8" fill="#9aa0a6" />
            <path
              d="M9 17C10.5 15.2 13.5 15.2 15 17"
              stroke="#9aa0a6"
              strokeWidth="1.75"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* Heading */}
        <h1
          style={{
            fontSize: "24px",
            fontWeight: 500,
            color: "#e8eaed",
            margin: "0 0 16px 0",
            lineHeight: 1.3,
            letterSpacing: "-0.2px",
          }}
        >
          This site can’t be reached
        </h1>

        {/* Message lines */}
        <p
          style={{
            fontSize: "13px",
            color: "#9aa0a6",
            margin: "0 0 16px 0",
            lineHeight: "20px",
          }}
        >
          Check if there is a typo in {hostname}.
        </p>

        <p
          style={{
            fontSize: "13px",
            color: "#9aa0a6",
            margin: "0 0 24px 0",
            lineHeight: "20px",
          }}
        >
          If spelling is correct,{" "}
          <span
            style={{ color: "#8ab4f8", cursor: "pointer", textDecoration: "none" }}
            onClick={() => window.location.reload()}
          >
            try running Windows Network Diagnostics
          </span>
          .
        </p>

        {/* Error code */}
        <p
          style={{
            fontSize: "11px",
            color: "#9aa0a6",
            fontWeight: 500,
            letterSpacing: "0.5px",
            margin: "0 0 32px 0",
          }}
        >
          DNS_PROBE_FINISHED_NXDOMAIN
        </p>

        {/* Reload button */}
        <button
          type="button"
          onClick={() => window.location.reload()}
          style={{
            backgroundColor: "#8ab4f8",
            color: "#202124",
            border: "none",
            borderRadius: "100px",
            padding: "8px 24px",
            fontSize: "13px",
            fontWeight: 500,
            cursor: "pointer",
            fontFamily: "inherit",
            outline: "none",
            transition: "background-color 0.15s ease",
          }}
          onMouseEnter={(e) => ((e.target as HTMLElement).style.backgroundColor = "#93bbf9")}
          onMouseLeave={(e) => ((e.target as HTMLElement).style.backgroundColor = "#8ab4f8")}
        >
          Reload
        </button>
      </div>
    </div>
  );
}
