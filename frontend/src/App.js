import React, { useEffect, useState } from "react";
import axios from "axios";
import Chatbot from "./components/Chatbot";

function App() {
  const [message, setMessage] = useState("");

  useEffect(() => {
    axios.get("http://localhost:5000/api/message") // Call the backend
      .then(response => setMessage(response.data.message))
      .catch(error => console.error("Error fetching data:", error));
  }, []);

  return (
    <div>
      <h1>SentinelBot - AI ERP Assistant</h1>
      <Chatbot />
    </div>
  );
}

export default App;
