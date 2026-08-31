import pick from "./utils/pick.js";

const user = {
    id : 1,
    name: "Monsur",
    age: 25
    
}


    const result = pick(user, ["id", "name"])


    console.log(result)