'use client'
import EditText, { IconType } from "@/components/EditText";
import { HeartPulseIcon } from "lucide-react";
import { useState } from "react";

export default function page() {
  const [email, setEmail] = useState("");
  const [hospitalId, setHospitalId] = useState("");

  return (
    <div className="w-full h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center w-full max-w-100 h-[80%] p-2 m-5 shadow-2xl rounded-lg">
          <HeartPulseIcon className="w-8 h-8 text-primary"/>
          <h1 className="text-xl font-bold">Cross-Cutting</h1>
          <p className="text-sm text-greyText mb-8">Secure Staff Access</p>
          <h1 className="text-xl font-bold">Welcome Back</h1>
          <p className="text-sm text-center text-greyText mb-8">Please sign in to access your<br/> dashboard</p>
          <EditText name="Email Address" icon={IconType.mail} placeholder="Email@srmist.edu.in" value={email} onChange={setEmail}/>
          <EditText name="Hospital ID" icon={IconType.hospital} placeholder="Hospital ID" value={hospitalId} onChange={setHospitalId}/>

        </div>
    </div>
  )
}