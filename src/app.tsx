import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardTitle,
} from "@/components/ui/card";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/components/ui/use-toast";
import { AthomCloudAPI } from "athom-api";
import { useAuth } from "oidc-react";
import { useState } from "react";
import "./animations.css";

interface HomeyApi {
  login: () => Promise<any>;
  auth: (accessToken: string, token: string, homeys: any[]) => Promise<void>;
  install: (homey: any) => Promise<void>;
}

declare global {
  const homey: {
    api: HomeyApi;
  };
}

export function App() {
  const auth = useAuth();
  const [authorizedHomey, setAuthorizedHomey] = useState<{
    profile: AthomCloudAPI.User;
    token: string;
  }>();
  const [isInstalling, setIsInstalling] = useState<string | null>(null);
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const { toast } = useToast();

  console.log(auth);

  const username = String(
    auth.userData?.profile.firstname ||
      auth.userData?.profile?.username ||
      "Guest"
  );

  return (
    <>
      <div className="min-h-screen p-6 md:p-8 lg:p-10 relative overflow-hidden bg-pattern">
        <div className="absolute inset-0 bg-gradient-to-br from-black/80 to-black pointer-events-none" />
        {authorizedHomey ? (
          <div className="container mx-auto max-w-4xl relative">
            <div className="mb-12 text-center animate-fade-up">
              <h1 className="text-4xl font-bold tracking-tight mb-3 bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
                Hi {String(authorizedHomey.profile.firstname || "")}
              </h1>
              <h2 className="text-lg text-gray-400">Your Homey Devices</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(authorizedHomey.profile.homeys || []).map((device, index) => (
                <Card
                  key={`${device.name}-${index}`}
                  className={`flex flex-col transition-all duration-300 hover:-translate-y-1 border border-white/10 bg-gradient-to-b from-white/[0.08] to-transparent backdrop-blur-2xl animate-fade-in animation-delay-${
                    index * 100
                  } group relative overflow-hidden`}
                >
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                    <div className="absolute inset-0 bg-gradient-to-b from-blue-500/[0.03] to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/[0.03] to-transparent" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="p-8 relative z-10">
                    <CardTitle className="text-xl mb-3 text-white/90">
                      {String(device.name || "Unnamed Device")}
                    </CardTitle>
                    <CardDescription className="text-sm text-gray-400/90">
                      {String((device as any).modelName || "Unknown Model")}
                    </CardDescription>
                  </div>
                  <CardFooter className="mt-auto p-6 pt-0 relative z-10">
                    <Button
                      className="w-full bg-blue-600/80 hover:bg-blue-500/80 text-white shadow-lg shadow-blue-500/10 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/20 backdrop-blur-sm group disabled:opacity-50"
                      onClick={async () => {
                        try {
                          setIsInstalling(device.name);
                          toast({
                            title: "Installation Started",
                            description: `Installing app on ${device.name}...`,
                            className:
                              "bg-black/80 border-white/10 text-white backdrop-blur-2xl",
                          });
                          await homey.api.install(device);
                          toast({
                            title: "Installation Complete",
                            description: `Successfully installed on ${device.name}!`,
                            className:
                              "bg-blue-950/80 border-blue-900/30 text-white backdrop-blur-2xl",
                          });
                        } catch (error) {
                          toast({
                            title: "Installation Failed",
                            description: `Failed to install on ${device.name}. Please try again.`,
                            className:
                              "bg-red-950/80 border-red-900/30 text-white backdrop-blur-2xl",
                          });
                        } finally {
                          setIsInstalling(null);
                        }
                      }}
                      disabled={isInstalling === device.name}
                    >
                      <span className="flex items-center justify-center gap-2">
                        {isInstalling === device.name ? (
                          <svg
                            className="w-5 h-5 animate-spin"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                          </svg>
                        ) : (
                          <svg
                            className="w-5 h-5 transition-transform group-hover:scale-110"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                            />
                          </svg>
                        )}
                        {isInstalling === device.name
                          ? "Installing..."
                          : "Install"}
                      </span>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex min-h-screen items-center justify-center">
            <div className="text-center space-y-8 max-w-md px-8 py-12 bg-gradient-to-b from-white/[0.08] to-transparent backdrop-blur-2xl rounded-2xl shadow-xl border border-white/10 animate-fade-up relative overflow-hidden group">
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-b from-blue-500/[0.03] to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/[0.03] to-transparent" />
              </div>
              <div className="space-y-3 relative z-10">
                <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
                  Homey Community Space
                </h1>
                <h2 className="text-lg text-gray-400">Welcome, {username}</h2>
              </div>
              <Button
                size="lg"
                className="bg-blue-600/80 hover:bg-blue-500/80 text-white shadow-lg shadow-blue-500/10 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/20 px-8 group disabled:opacity-50 backdrop-blur-sm relative z-10"
                onClick={async () => {
                  try {
                    setIsAuthorizing(true);
                    const _auth = await homey.api.login();
                    await homey.api.auth(
                      auth.userData?.access_token || "",
                      _auth.token,
                      _auth.profile.homeys.filter(
                        (e: any) => e.platform === "local"
                      )
                    );
                    setAuthorizedHomey(_auth);
                  } catch (error) {
                    toast({
                      title: "Authorization Failed",
                      description:
                        "Failed to authorize with Homey. Please try again.",
                      className:
                        "bg-red-950/80 border-red-900/30 text-white backdrop-blur-2xl",
                    });
                  } finally {
                    setIsAuthorizing(false);
                  }
                }}
                disabled={isAuthorizing}
              >
                <span className="flex items-center justify-center gap-2">
                  {isAuthorizing ? (
                    <svg
                      className="w-5 h-5 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-5 h-5 transition-transform group-hover:scale-110"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                      />
                    </svg>
                  )}
                  {isAuthorizing ? "Authorizing..." : "Authorize with Homey"}
                </span>
              </Button>
            </div>
          </div>
        )}
      </div>
      <Toaster />
    </>
  );
}
