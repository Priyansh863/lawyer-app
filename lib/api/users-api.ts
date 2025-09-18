import endpoints from "@/constant/endpoints";

export async function getClientsAndLawyers() {
  const stringUser = localStorage.getItem("user");
  const user = stringUser ? JSON.parse(stringUser) : null;
  const token = user?.token;

  const res = await fetch(endpoints.user.GET_CLIENTS_AND_LAWYERS, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) throw new Error("Failed to fetch users");

  return res.json(); // returns { success, clients, lawyers }
}

// Get all lawyers (public endpoint)
export async function getLawyers() {
  const res = await fetch(endpoints.user.LAWYERS, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch lawyers: ${res.statusText}`);
  }

  

  const data = await res.json();
  return { success: true, users: data.data || [] };
}

// Get all clients (authenticated endpoint)
export async function getClients() {
  const stringUser = localStorage.getItem("user");
  const user = stringUser ? JSON.parse(stringUser) : null;
  const token = user?.token;

  if (!token) {
    throw new Error("No authentication token found");
  }

  const res = await fetch(endpoints.user.CLIENTS_LIST, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch clients: ${res.statusText}`);
  }

  const data = await res.json();
  return { success: true, users: data.clients || [] };
}

// Get related users based on current user role
export async function getRelatedUsers() {
  const stringUser = localStorage.getItem("user");
  const user = stringUser ? JSON.parse(stringUser) : null;
  
  if (!user) {
    throw new Error("User not authenticated");
  }

  // Use dedicated endpoints based on user role
  if (user.account_type === 'lawyer') {
    return getClients();
  } else if (user.account_type === 'client') {
    return getLawyers();
  }
  
  throw new Error("Invalid user role");
}