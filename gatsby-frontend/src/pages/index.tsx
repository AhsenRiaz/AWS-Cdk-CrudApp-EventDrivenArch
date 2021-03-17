import React ,  {useState , useEffect} from "react"
import Todo from "../components/Todo"
import { AuthState , onAuthUIStateChange } from "@aws-amplify/ui-components"
import {AmplifySignOut , AmplifyAuthenticator } from "@aws-amplify/ui-react"

// markup
const IndexPage = () => {

  const [authState , setAuthState] = useState<AuthState>();
  const [user , setUser] = useState<any>() 

  useEffect(() => {
    onAuthUIStateChange((nextAuthState , authData) => {
        setAuthState(nextAuthState)
        setUser(authData)
    })
  },[])

  return (
   <div>
     {authState === AuthState.SignedIn && user ? (
       <div>
         <Todo/>
         <AmplifySignOut/>
       </div>
     ): (
       <AmplifyAuthenticator/>
     )}
   </div>
  )
}

export default IndexPage
