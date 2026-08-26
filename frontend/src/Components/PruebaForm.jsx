import { useForm } from "react-hook-form";

export default function PruebaForm(){
    const {register,handleSubmit,reset} = useForm()

    const guardarItem = (data)=>{
        console.log("Datos");
    }
}