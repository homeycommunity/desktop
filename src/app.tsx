import { Button } from "@/components/ui/button";
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
            <h1>Authorized Homey</h1>
            <p>Homey is authorized and ready to use</p>
            <p>Hi {authorizedHomey.profile.fullname},</p>
            <h2>Registered Homey's</h2>
            <ul>
                {authorizedHomey.profile.homeys?.map((e: any) => <li>
                    <p>{e.name}<br /><small>{e.modelName}</small></p>
                </li>)}
            </ul>
        </div> :
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
        }

    </>;
}