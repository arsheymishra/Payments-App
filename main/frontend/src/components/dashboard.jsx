import React, { useState, useEffect } from 'react';

const Dashboard = () => {
  const [balance, setBalance] = useState(0);
  const [username, setUsername] = useState('');
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch the balance and users
    fetch('https://payments-app-api-sigma.vercel.app/api/v1/account/balance', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setBalance(data.balance);
        setUsername(data.username);
      })
      .catch((err) => console.error(err));

    fetch('https://payments-app-api-sigma.vercel.app/api/v1/user/', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    })
      .then((res) => res.json())
      .then((data) => setUsers(data))
      .catch((err) => console.error(err));
  }, []);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    // Fetch filtered users
    fetch(`https://payments-app-api-sigma.vercel.app/api/v1/user/bulk?filter=${e.target.value}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    })
      .then((res) => res.json())
      .then((data) => setUsers(data.users))
      .catch((err) => console.error(err));
  };

  const handleSendMoney = () => {
    // API call to transfer money
    if (amount <= 0) {
      setError('Amount must be greater than 0');
      return;
    }

    fetch('https://payments-app-api-sigma.vercel.app/api/v1/account/transfer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({
        to: selectedUser._id, // Use 'to' to match your backend
        amount: Number(amount),
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          // Update balance after successful transfer
          setBalance((prevBalance) => prevBalance - Number(amount));
          setIsModalOpen(false);
          setAmount('');
          setError(null);
        } else {
          setError(data.message || 'Transfer failed');
        }
      })
      .catch((err) => {
        console.error(err);
        setError('Transfer failed. Please try again.');
      });
  };

  const openModal = (user) => {
    setSelectedUser(user);
    setIsModalOpen(true);
    setError(null);
    setAmount(''); // Reset amount when opening the modal
  };

  return (
    <div className="bg-gray-100 h-screen p-4">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center py-4">
          <h1 className="text-2xl font-bold">Payments App</h1>
          <div className="text-lg">Hello, {username}</div>
        </header>

        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold">Your Balance</h2>
          <p className="text-3xl font-bold text-blue-500 mt-2">${balance}</p>
        </div>

        <div className="bg-white shadow-md rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-4">Users</h3>
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={handleSearch}
            className="w-full p-2 mb-4 border border-gray-300 rounded"
          />

          <div className="space-y-4">
            {users.length === 0 ? (
              <p>No users found</p>
            ) : (
              users.map((user) => (
                <div
                  key={user._id} // Use unique identifier here
                  className="flex justify-between items-center bg-gray-50 p-4 rounded-lg shadow-sm"
                >
                  <div className="flex items-center">
                    <div className="w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center text-lg font-semibold mr-4">
                      {user.username[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-lg font-medium">{user.username}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => openModal(user)}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg shadow"
                  >
                    Send Money
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modal for sending money */}
      {isModalOpen && selectedUser && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h2 className="text-xl font-bold mb-4">Send Money to {selectedUser.username}</h2>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              className="w-full p-2 mb-4 border border-gray-300 rounded"
            />
            {error && <p className="text-red-500 mb-4">{error}</p>}
            <div className="flex justify-end space-x-4">
              <button
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                onClick={handleSendMoney}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;