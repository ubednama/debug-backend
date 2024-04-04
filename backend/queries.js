require('dotenv').config()

const Pool = require('pg').Pool
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
})


pool.connect((err, client, release) => {
  if(err) {
    console.error("Error connecting to the database: ", err)
  } else {
    console.log('Connection to DB established successfully')
  }
  release()
})

// Our first endpoint will be a GET request. 
// /user
// SELECT all users and order by id.
const getUsers = (request, response) => {
  pool.query('SELECT * FROM users ORDER BY id ASC', (error, results) => {
    if (error) {
      console.error("Error fetching users: ",error)
      response.status(500).json({ error: 'Internal Server Error' });
      return;
      // throw error
    }
    response.status(200).json(results.rows)
  })
}


// For  /users/:id request, :id using a WHERE clause to display the result.
// In the SQL query, we’re looking for id=$1. In this instance, $1 is a numbered placeholder,
// which PostgreSQL uses natively instead of the ? placeholder you may be familiar with from other flavors of SQL.
const getUserById = (request, response) => {
  const id = parseInt(request.params.id)
  // troubleshoot this line of code further, not functioning correctly
  pool.query('SELECT * FROM users WHERE id =', id, (error, results) => {
    if (error) {
      console.error("Error fetching user by ID:", error)
      response.status(500).json({ error: 'Internal Server Error' });
      return;
      // throw error
    }
    if(results.rows.length === 0) {
      response.status(404).json({error: "User not found"})
      return
    }
    response.status(200).json(results.rows)
  })
}

//   The API will take a GET and POST request to the /users endpoint. In the POST request, we’ll be adding a new user. 
//   In this function, we’re extracting the name and email properties from the request body, and INSERTING the values.
const createUser = (request, response) => {
  const { name, email } = request.body

  //query to check if email id already exists in database
  pool.query('SELECT * FROM users WHERE email = $1',[email], (error, result) => {
    if(error) {
      console.error('Error checking for duplicate email: ', error);
      response.status(500).json({error: 'Internal server error'})
      return;
    }
    if(result.rows.length > 0){
      response.status(400).json({error: 'Email ID already exists'})
      return;
    }
  
    pool.query('INSERT INTO users (name, email) VALUES ($1, $2) RETURNING id', [name, email], (error, result) => {
      if (error) {
        console.error('Error creating user:', error);
        response.status(500).json({ error: 'Internal Server Error' });
        return;
        // throw error
      }
      response.status(201).send(`User created successfully with ID ${result.rows[0].id}`);
      console.log("User created",{id: result.rows[0].id})
      // troubleshoot this line of code further, not functioning correctly
    })
  })
}

//   The /users/:id endpoint will update the user 
const updateUser = (request, response) => {
  const id = parseInt(request.params.id)
  const { name, email } = request.body

  pool.query(
    'UPDATE users SET name = $1, email = $2 WHERE id = $3',
    [name, email, id],
    (error, results) => {
      if (error) {
        console.error('Error updating user:', error);
        response.status(500).json({ error: 'Internal Server Error' });
        // throw error
        return;
      }
      if (results.rowCount === 0) {
        response.status(404).json({ error: 'User not found' });
        return;
      }
      response.status(200).send(`User modified with ID: ${id}`)
    }
  )
}

// DELETE clause on /users/:id to delete a specific user by id. 
const deleteUser = (request, response) => {
  const id = parseInt(request.params.id)

  pool.query('DELETE FROM users WHERE id = $1', [id], (error, results) => {
    if (error) {
      console.error('Error deleting user:', error);
      response.status(500).json({ error: 'Internal Server Error' });
      // throw error
      return;
    }
    if(results.rowCount === 0) {
      response.status(404).json({error: "User not found"})
      return;
    }
    response.status(200).send(`User deleted with ID: ${id}`)
    // console.log(response)
  })
}

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
}
