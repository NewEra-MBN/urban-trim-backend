const user = {
    name:"Kamal",
    age: 22
}

const tokenData = "shami"


console.log({
    ...user,
    ...(tokenData && { tokenData })
})