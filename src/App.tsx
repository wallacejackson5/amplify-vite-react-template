import { useEffect, useState } from "react";
import type { Schema } from "../amplify/data/resource";
import { useAuthenticator } from '@aws-amplify/ui-react';
import { FileUploader } from '@aws-amplify/ui-react-storage';
import { generateClient } from "aws-amplify/data";

const client = generateClient<Schema>();

function App() {
  const { signOut, user } = useAuthenticator();
  const [todos, setTodos] = useState<Array<Schema["Todo"]["type"]>>([]);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);

  useEffect(() => {
    client.models.Todo.observeQuery().subscribe({
      next: (data) => setTodos([...data.items]),
    });
  }, []);

  function createTodo() {
    client.models.Todo.create({ content: window.prompt("Todo content") });
  }

    
  function deleteTodo(id: string) {
    client.models.Todo.delete({ id })
  }

  return (
    <main>
      <h1>My todos</h1>
      <button onClick={createTodo}>+ new</button>
      <ul>
        {todos.map((todo) => (
          <li 
          onClick={() => deleteTodo(todo.id)}
          key={todo.id}>{todo.content}</li>
        ))}
      </ul>
      
      <div style={{ margin: '20px 0', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
        <h2>Profile Picture Upload</h2>
        <p>Upload your profile pictures (JPEG/PNG, max 500MB)</p>
        <FileUploader
          acceptedFileTypes={['image/jpeg', 'image/png']}
          path={`protected/profile-pictures/${user?.userId}/`}
          maxFileCount={5}
          isResumable
          onUploadSuccess={(result) => {
            console.log('Upload successful:', result);
            if (result.key) {
              setUploadedFiles(prev => [...prev, result.key!]);
            }
          }}
          onUploadError={(error) => {
            console.error('Upload error:', error);
          }}
        />
        
        {uploadedFiles.length > 0 && (
          <div style={{ marginTop: '20px' }}>
            <h3>Uploaded Files:</h3>
            <ul>
              {uploadedFiles.map((fileKey, index) => (
                <li key={index} style={{ marginBottom: '5px' }}>
                  {fileKey.split('/').pop()}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div>
        🥳 App successfully hosted. Try creating a new todo.
        <br />
        <a href="https://docs.amplify.aws/react/start/quickstart/#make-frontend-updates">
          Review next step of this tutorial.
        </a>
      </div>
      <button onClick={signOut}>Sign out</button>
    </main>
  );
}

export default App;
