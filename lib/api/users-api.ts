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
