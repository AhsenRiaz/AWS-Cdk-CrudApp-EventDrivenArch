import React, { useState, useRef, useEffect } from "react"
import { addTodo , deleteTodo, updateTodo } from "../graphql/mutations"
import { getTodos } from "../graphql/queries"
import { API } from "aws-amplify"
import { Button, Container, TextField } from "@material-ui/core";
import {DeleteOutline , UpdateOutlined } from "@material-ui/icons"
import { makeStyles } from '@material-ui/core/styles';
import Modal from '@material-ui/core/Modal';
import Backdrop from '@material-ui/core/Backdrop';
import Fade from '@material-ui/core/Fade';
import Loader from "./Loader";
const shortid = require("short-id")
const style = require("./todo.module.css")

const useStyles = makeStyles((theme) => ({
    modal: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    paper: {
      backgroundColor: theme.palette.background.paper,
      border: '2px solid #000',
      boxShadow: theme.shadows[5],
      padding: theme.spacing(4, 15, 6),
      
    },
  }));


interface title {
  todo: string
  id : string
}

interface incomingData {
  data: {
    getTodos: title[]
  }
}

export default function Todo() {

    const classes = useStyles();
    const [open, setOpen] = React.useState(false);
  
    // modal open
    const handleOpen = () => {
      setOpen(true);
    };
    // modal close    
    const handleClose = () => {
      setOpen(false);
    };

    const [loading , setLoading]  = useState<boolean>(true)
    const [todoData, setTodoData] = useState<incomingData | null>(null)
    const [todoInput , setTodoInput] = useState<string>("")
    const [updateTodoInput , setUpdateTodoInput] = useState<string>("")

    //  add todo to dynamodb
  const addTodoMutation = async () => {
    try {
      const data = await API.graphql({
        query: addTodo,
        variables: {
          todo: todoInput,
        },
      })

      setTodoInput("")
      fetchTodos()
    } catch (e) {
      console.log(e)
    }
  }

    //   getTodos
  const fetchTodos = async () => {
    try {
      const data = await API.graphql({
        query: getTodos,
      })
      setTodoData(data as incomingData)
      setLoading(false)
      console.log(data)
    } catch (e) {
      console.log(e)
    }
  }


  useEffect(() => {
    fetchTodos()
  }, [])

  return (
    <div className = {style.Todo_container} >
        <div className = {style.Todo_input}>
             <Container maxWidth = "md"  >
                 <div className = {style.Todo_submit} >
                     <div className = {style.Todo_field} >
                <TextField 
                variant = "outlined" 
                color = "secondary"  
                label = "Add Todo"
                type = "text"
                value = {todoInput}
                fullWidth
                onChange = {(e) => {
                    setTodoInput(e.target.value)
                }}
                />
                    </div>
                <div className = {style.Todo_button} >
                    <Button 
                    aria-required 
                    disabled = {todoInput.length < 5} 
                    color = "primary" 
                    variant = "outlined" 
                    onClick = {addTodoMutation} >
                    Add Task
                    </Button>
                    </div>
                </div>
            </Container>
        </div>

       {loading ? <Loader/> : (
           <div className = {style.Todo_list_container} >
                <h1 className = {style.Todo_heading} >Task : {todoData.data.getTodos.length}</h1>
               {todoData.data.getTodos.map((item) => {
             
                   return (
                     <Container key = {item.id} maxWidth = "sm" >
                       
                         <div className = {style.Todo_list_div} >
                            <ul>
                                <li>
                                    <div className = {style.list_div} >
                                        <p>{item.todo}</p>
                                    </div>
                                </li>
                            </ul>

                            <div className = {style.Todo_deleteButton} >
                                <Button onClick = { async () => {
                                    try {
                                        await API.graphql({
                                            query : deleteTodo,
                                            variables : {
                                                id : item.id
                                            },
                                        })
                                        fetchTodos()
                                    }
                                    catch(err){
                                        console.log(err)
                                    }
                                }}><DeleteOutline /></Button>
                            </div>

                            <div className = {style.Todo_updateButton} >
                                <Button onClick = {handleOpen} >
                                    <UpdateOutlined/>
                                </Button>
                                <Modal
                                aria-labelledby="transition-modal-title"
                                aria-describedby="transition-modal-description"
                                className={classes.modal}
                                open={open}
                                onClose={handleClose}
                                closeAfterTransition
                                BackdropComponent={Backdrop}
                                BackdropProps={{
                                timeout: 500,
                                }}
                            >
                                 <Fade in={open}>
                                <div className={classes.paper}>
                                  <h3 style = {{fontFamily : "Poppins"}} >Update Todo</h3>
                                    <TextField  
                                    value = {updateTodoInput}  
                                    variant = "filled"
                                    color = "secondary"
                                    label = "Enter todo"
                                    onChange = {(e) => {
                                        setUpdateTodoInput(e.target.value)
                                    }} />
                                <Button
                                
                                style = {{marginTop : "0.5rem" , marginLeft  :"1rem"}}
                                disabled = {updateTodoInput.length < 5}
                                color = "primary"
                                variant = "contained" 
                                onClick = {async() => {
                                   
                                      const data = await API.graphql({
                                        query : updateTodo,
                                        variables : {
                                          id : item.id,
                                          todo : updateTodoInput
                                        },
                                      });
                                      fetchTodos()
                                      handleClose()
                                }} > Update Todo </Button>
                                </div>
                                </Fade>
                                </Modal>
                            </div>
                         </div>
                     </Container>
                   )
               })}
           </div>
       ) }
      
      </div>

  )
}