import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardFooter, CardTitle } from "@/components/ui/card";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/components/ui/use-toast";
import { AthomCloudAPI } from "athom-api";
import { useAuth } from "oidc-react";
import { useState } from "react";

declare const homey: any
export function App () {
    const auth = useAuth();
    const [authorizedHomey, setAuthorizedHomey] = useState<{ profile: AthomCloudAPI.User }>()
    const { toast } = useToast();
    return <>
        {authorizedHomey ? <div style={{ height: '100vh', width: '100vw', padding: 40, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            <h1 className="text-lg mb-4">Hi {authorizedHomey.profile.firstname},</h1>
            <h2>Registered Homey's</h2>
            <div className="">
                {authorizedHomey.profile.homeys?.map((e) => <Card>
                    <CardTitle>{e.name}</CardTitle>
                    <CardDescription>{(e as any).modelName}</CardDescription>

                    <CardFooter className="flex justify-between">
                        <Button onClick={async () => {
                            toast({
                                title: `Installing on ${e.name}...`,
                            })
                            await homey.api.install(e);
                            toast({
                                title: `Installed on ${e.name}!`,
                            })
                        }}>Install</Button>
                    </CardFooter>
                </Card>)}
            </div>
        </div> :
            <div style={{ height: '100vh', width: '100vw', padding: 40, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                <h1 className="text-lg mb-4">Homey Community Space</h1>
                <Button onClick={async () => {
                    const _auth = await homey.api.login();
                    await homey.api.auth(auth.userData?.access_token, _auth.token, _auth.profile.homeys.filter((e: any) => e.platform === 'local'))

                    setAuthorizedHomey(_auth);
                }} >Authorize with Homey</Button >
            </div>
        }
        <Toaster />
    </>;
}