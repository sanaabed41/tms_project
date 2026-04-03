export enum FactureStatus {
  DRAFT = 'DRAFT',           // brouillon
  SENT = 'SENT',             // envoyée au client
  PAID = 'PAID',             // payée
  OVERDUE = 'OVERDUE',       // en retard
  CANCELLED = 'CANCELLED',   // annulée
}

export enum ModePaiement {
  VIREMENT = 'VIREMENT',
  CHEQUE = 'CHEQUE',
  ESPECES = 'ESPECES',
  CARTE = 'CARTE',
}