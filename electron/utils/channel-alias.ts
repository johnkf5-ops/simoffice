/**
 * Channel Alias Mapping
 *
 * Translates between SimOffice UI channel types and OpenClaw Gateway channel types
 * where they differ. SimOffice uses 'imessage' in the UI, but OpenClaw expects
 * 'bluebubbles' for the BlueBubbles-based iMessage bridge.
 */

const UI_TO_GATEWAY: Record<string, string> = {
    imessage: 'bluebubbles',
};

const GATEWAY_TO_UI: Record<string, string> = Object.fromEntries(
    Object.entries(UI_TO_GATEWAY).map(([k, v]) => [v, k]),
);

/** Convert a SimOffice UI channel type to the OpenClaw Gateway config key. */
export function toGatewayChannelType(uiType: string): string {
    return UI_TO_GATEWAY[uiType] || uiType;
}

/** Convert an OpenClaw Gateway channel type back to the SimOffice UI type. */
export function toUiChannelType(gatewayType: string): string {
    return GATEWAY_TO_UI[gatewayType] || gatewayType;
}
