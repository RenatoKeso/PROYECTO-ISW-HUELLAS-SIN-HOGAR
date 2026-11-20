import { promises as dns } from "node:dns";


export async function dominioRecibeCorreos(email) {
  const dominio = email.split("@")[1];

  try {
    const servidores = await dns.resolveMx(dominio);
    return servidores.length > 0;
  } catch {
    
    return !(await hayInternet());
  }
}

async function hayInternet() {
  try {
    await dns.resolveMx("gmail.com");
    return true;
  } catch {
    return false;
  }
}