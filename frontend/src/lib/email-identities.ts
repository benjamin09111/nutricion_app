export type SenderEmail =
  | "notificaciones@nutrinet.cl"
  | "soporte@nutrinet.cl"
  | "pagos@nutrinet.cl"
  | "info@nutrinet.cl"
  | "seguridad@nutrinet.cl"
  | "marketing@nutrinet.cl"
  | "rrhh@nutrinet.cl";

export const AVAILABLE_SENDER_EMAILS: Array<{
  value: SenderEmail;
  label: string;
}> = [
  { value: "notificaciones@nutrinet.cl", label: "NutriNet Notificaciones" },
  { value: "soporte@nutrinet.cl", label: "NutriNet Soporte" },
  { value: "pagos@nutrinet.cl", label: "NutriNet Pagos" },
  { value: "info@nutrinet.cl", label: "NutriNet Info" },
  { value: "seguridad@nutrinet.cl", label: "NutriNet Seguridad" },
  { value: "marketing@nutrinet.cl", label: "NutriNet Marketing" },
  { value: "rrhh@nutrinet.cl", label: "NutriNet RRHH" },
];

export const DEFAULT_SENDER_EMAIL: SenderEmail = "notificaciones@nutrinet.cl";
