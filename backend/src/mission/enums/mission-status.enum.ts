export enum MissionStatus {
  PENDING = 'PENDING',           // créée, pas encore assignée
  ASSIGNED = 'ASSIGNED',         // camion + driver assignés
  IN_PROGRESS = 'IN_PROGRESS',   // en cours
  DELIVERED = 'DELIVERED',       // livraison effectuée
  DONE = 'DONE',                 // mission clôturée
  CANCELLED = 'CANCELLED',       // annulée
}