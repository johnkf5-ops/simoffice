// Stub — Claw3D gateway client not needed in SimOffice
export function getLocalGatewayUrl() { return 'http://localhost:18789'; }
export function getLocalGatewayToken() { return ''; }
export function isLocalGatewayUrl(_url: string) { return false; }
export class LocalGatewayClient {
  async rpc() { return {}; }
  async connect() {}
  disconnect() {}
}
