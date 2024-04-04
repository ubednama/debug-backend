import React, { useState, useEffect } from 'react';
import NewUserForm from './Components/NewUserForm';
import EditUserForm from './Components/EditUserForm';

const App = () => {

  const initialFormState = {
    id: '',
    name: '',
    email: ''
  }

  const [users, setUsers] = useState([])
  const [currentUser, setCurrentUser] = useState(initialFormState)
  const [editing, setEditing] = useState(false)
  //to manage error message
  const [message, setMessage] = useState(null)
  const [loading, setLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    const timer = setInterval(() => {
      setMessage(null)
    }, 3000)
    
    return () => clearInterval(timer)
  }, [message])

  useEffect(() => {
    fetchUsers();
  }, [])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const response = await fetch(`http://localhost:8080/users`)
      if (!response.ok) {
        const responseData = await response.json();
        throw new Error(responseData.error)
      }
      setLoading(false)
      const userData = await response.json();
      setUsers(userData)
      setMessage(null)
    } catch (error) {
      setLoading(false)
      console.error("Error fetching users: ", error)
      setMessage("Error fetching users: " + error.message)
    }
  }

  const handleInputChange = event => {
    const { id, value } = event.target
    setCurrentUser({ ...currentUser, [id]: value })
  }

  const submitNewUser = async (event) => {
    event.preventDefault();

    if (!currentUser.name.trim() || !currentUser.email.trim()) {
      setMessage("Both Name and email ID are required.");
      return;
    }
    // console.log(currentUser)
    try {
      const response = await fetch('http://localhost:8080/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(currentUser),
      })
      if(!response.ok) {
        const responseData = await response.json();
        throw new Error(responseData.error)
      }
      const data = await response.text();
      fetchUsers()
      setCurrentUser(initialFormState)
      setTimeout(()=>{
        setMessage(data)
      }, 100)
    } catch (error) {
      console.error("Error creating user: ", error)
      setMessage("Error creating user: " + error.message)
    }
  }

  const deleteUser = async (item) => {
    try {
      const response = await fetch(`http://localhost:8080/users/${item.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      if(!response.ok) {
        const responseData = await response.json();
        throw new Error(responseData.error)
      }
      const responseData = await response.text()
      setUsers(users.filter(user => user.id !== item.id))
      setMessage(responseData)
    } catch (error) {
      console.error("Error deleting user: ", error)
      setMessage("Error deleting user: " + error.message)
    }
  }

  const editUser = item => {
    console.log(item)
    setEditing(true)
    setCurrentUser({ id: item.id, name: item.name, email: item.email })
  }

  const submitUserEdit = async (event) => {
    event.preventDefault()

    try {
      const response = await fetch(`http://localhost:8080/users/${currentUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(currentUser),
      })
      console.log("response sending",response, currentUser)
      if (!response.ok) {
        console.log("response not ok",response)
        throw new Error("Failed to update user");
      }
      fetchUsers()
      const responseData = await response.text();
      setCurrentUser(initialFormState)
      setEditing(false)
      setTimeout(()=>{
        setMessage(responseData)
      },100)
    } catch (error) {
      console.error('Error updating user: ', error)
      setMessage('Error updating user: ' + error.message)
    }
  }

  const totalPages = Math.ceil(users.length/ itemsPerPage) || 1

  return (
    <div className="container">
      <h1>Full Stack Assignment</h1>
      <h5>Basic CRUD Opreations</h5>

      {message && <div className="error">{message}</div>}
      { loading ? ( <p>Loading....</p>
      ) : (<div className="flex-row">
        {editing ?
          <div className="flex-large">
            <EditUserForm
              submitUserEdit={submitUserEdit}
              handleInputChange={handleInputChange}
              currentUser={currentUser}
            />
          </div>
          :
          <div className="flex-large">
            <NewUserForm
              submitNewUser={submitNewUser}
              handleInputChange={handleInputChange}
              currentUser={currentUser}
            />
          </div>
        }

        <div className="flex-large">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Actions</th>
                <th>
                    <span>Items per page:</span>
                    <select value={itemsPerPage} onChange={(e) => setItemsPerPage(parseInt(e.target.value))}>
                      {[...Array(10).keys()].map((number) => (
                        <option key={number + 1} value={number + 1}>{number + 1}</option>
                      ))}
                    </select>
                  </th>
              </tr>
            </thead>
            <tbody>
              {users?.slice((currentPage-1)*itemsPerPage, currentPage * itemsPerPage).map(item =>
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{item.email}</td>
                  <td>
                    <button onClick={() => editUser(item)} className="muted-button" >Edit</button>
                    <button onClick={() => deleteUser(item)} style={{ marginLeft: 5 }} className="muted-button" >Delete</button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div>
            <button onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1}>
              Previous
            </button>
            <span>Page {currentPage}</span>
            <button onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === totalPages}>
              Next
            </button>
          </div>
        </div>
      </div>) }
    </div>
  );
}

export default App;
