import React from 'react'
import {SpinnerRoundFilled} from "spinners-react"
const style = require("./todo.module.css")

const Loader = () => {
    return (
        <div className = {style.spinner} >
        <SpinnerRoundFilled size={50} thickness={180} speed={180} color="rgba(57, 62, 172, 1)" />        
        </div>
    )
}

export default Loader