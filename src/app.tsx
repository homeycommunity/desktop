import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardFooter, CardTitle } from "@/components/ui/card";
import axios from "axios";
import { useAuth } from "oidc-react";
import { useState } from "react";

declare const homey: any
export function App () {
    const auth = useAuth();
    const [authorizedHomey, setAuthorizedHomey] = useState<any>(null)
    console.log(authorizedHomey)
    return <>
        {authorizedHomey ? <div>
            <h1 className="text-lg mb-4">Hi {authorizedHomey.profile.fullname},</h1>
            <h2>Registered Homey's</h2>
            <div className="">
                {authorizedHomey.profile.homeys?.map((e: any) => <Card>
                    <CardTitle>{e.name}</CardTitle>
                    <CardDescription>{e.modelName}</CardDescription>

                    <CardFooter className="flex justify-between">
                        <Button>Install</Button>
                    </CardFooter>
                </Card>)}
            </div>
        </div> :
            <div style={{ height: '100vh', width: '100vw', padding: 40, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                <h1 className="text-lg mb-4">Homey Community Space</h1>
                <Button onClick={async () => {
                    const _auth = await homey.api.login();
                    setAuthorizedHomey(_auth)
                    await axios.post('https://homeycommunity.space/api/hcs/authorize', {
                        token: _auth.token,
                        homey: _auth.profile.homeys.filter((e: any) => e.platform === 'local').map((e: any) => ({ name: e.name, id: e.id }))
                    }, {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${auth.userData?.access_token}`
                        }

                    })
                }} >Authorize with Homey</Button >
            </div>
        }

    </>;
}