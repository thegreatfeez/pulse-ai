import { ImageResponse } from "next/og";

export const size = {
    width: 1200,
    height: 630,
};

export const contentType = "image/png";

export default function Image() {
    return new ImageResponse(
        (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    background: "#2563EB",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    fontFamily: "sans-serif",
                    color: "white",
                }}
            >
                {/* Logo */}
                <div
                    style={{
                        position: "relative",
                        width: 140,
                        height: 140,
                        borderRadius: 36,
                        background: "#1D4ED8",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        marginBottom: 40,
                    }}
                >
                    {/* White core */}
                    <div
                        style={{
                            width: 72,
                            height: 72,
                            borderRadius: "40% 60% 50% 50%",
                            background: "white",
                        }}
                    />

                    {/* Spark */}
                    <div
                        style={{
                            position: "absolute",
                            top: 22,
                            right: 22,
                            width: 18,
                            height: 18,
                            borderRadius: "50%",
                            background: "#93C5FD",
                            boxShadow: "0 0 0 6px rgba(255,255,255,0.2)",
                        }}
                    />
                </div>

                {/* Text */}
                <div
                    style={{
                        fontSize: 88,
                        fontWeight: 700,
                        lineHeight: 1,
                    }}
                >
                    Stash
                </div>

                <div
                    style={{
                        fontSize: 32,
                        marginTop: 16,
                        opacity: 0.9,
                    }}
                >
                    Stablecoin banking
                </div>
            </div>
        ),
        size
    );
}