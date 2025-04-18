'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'

export default function Home() {
  const [todos, setTodos] = useState([])
  const [newTodo, setNewTodo] = useState('')
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [editText, setEditText] = useState('')
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.push('/signin')
      else {
        setSession(data.session)
        fetchTodos(data.session.user.id)
      }
      setLoading(false)
    })
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!session) router.push('/signin')
      }
    )
    
    return () => subscription.unsubscribe()
  }, [])

  const fetchTodos = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        
      if (error) throw error
      setTodos(data || [])
    } catch (error) {
      console.error('Error fetching todos:', error)
    }
  }

  const addTodo = async (e) => {
    e.preventDefault()
    if (!newTodo.trim()) return
    
    try {
      const { data, error } = await supabase
        .from('todos')
        .insert([{ title: newTodo.trim(), user_id: session.user.id }])
        .select()
        
      if (error) throw error
      setTodos([data[0], ...todos])
      setNewTodo('')
    } catch (error) {
      console.error('Error adding todo:', error)
    }
  }

  const toggleTodo = async (id, current) => {
    try {
      const { error } = await supabase
        .from('todos')
        .update({ is_complete: !current })
        .eq('id', id)
        
      if (error) throw error
      
      setTodos(todos.map(todo => 
        todo.id === id ? { ...todo, is_complete: !current } : todo
      ))
    } catch (error) {
      console.error('Error updating todo:', error)
    }
  }

  const deleteTodo = async (id) => {
    try {
      const { error } = await supabase
        .from('todos')
        .delete()
        .eq('id', id)
        
      if (error) throw error
      setTodos(todos.filter((todo) => todo.id !== id))
    } catch (error) {
      console.error('Error deleting todo:', error)
    }
  }
  
  const startEditing = (todo) => {
    setEditingId(todo.id)
    setEditText(todo.title)
  }
  
  const saveEdit = async () => {
    if (!editText.trim()) return
    
    try {
      const { error } = await supabase
        .from('todos')
        .update({ title: editText.trim() })
        .eq('id', editingId)
        
      if (error) throw error
      
      setTodos(todos.map(todo => 
        todo.id === editingId ? { ...todo, title: editText.trim() } : todo
      ))
      
      // Reset editing state
      setEditingId(null)
      setEditText('')
    } catch (error) {
      console.error('Error updating todo:', error)
    }
  }
  
  const cancelEdit = () => {
    setEditingId(null)
    setEditText('')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="p-8 max-w-xl mx-auto mt-6">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">My To-Do List</h1>
        
        <form onSubmit={addTodo} className="flex mb-6">
          <input 
            className="border p-3 w-full rounded-l focus:outline-none focus:ring-2 focus:ring-blue-300" 
            value={newTodo} 
            onChange={(e) => setNewTodo(e.target.value)} 
            placeholder="Add a task..." 
            required
          />
          <button 
            type="submit" 
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 rounded-r font-medium"
          >
            Add
          </button>
        </form>
        
        {todos.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            You don't have any tasks yet. Add one above!
          </div>
        ) : (
          <ul className="bg-white rounded-lg shadow overflow-hidden">
            {todos.map((todo) => (
              <li 
                key={todo.id} 
                className="flex justify-between items-center p-4 border-b last:border-b-0 hover:bg-gray-50 transition-colors"
              >
                {editingId === todo.id ? (
                  <div className="flex items-center w-full gap-2">
                    <input 
                      type="text"
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="border p-2 flex-grow rounded focus:outline-none focus:ring-2 focus:ring-blue-300"
                      autoFocus
                    />
                    <button 
                      onClick={saveEdit}
                      className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
                    >
                      Save
                    </button>
                    <button 
                      onClick={cancelEdit}
                      className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-1 rounded text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center">
                      <input 
                        type="checkbox"
                        checked={todo.is_complete}
                        onChange={() => toggleTodo(todo.id, todo.is_complete)}
                        className="mr-3 h-5 w-5 cursor-pointer"
                      />
                      <span className={`${todo.is_complete ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                        {todo.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => startEditing(todo)} 
                        className="text-blue-500 hover:text-blue-700 p-1"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => deleteTodo(todo.id)} 
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
