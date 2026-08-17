import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  UserRole,
  UserPermission,
  Flight,
  Baggage,
  Dolly,
  Company,
  FlightTaskItem,
  AuditLog,
  UserSessionLog,
  HoldPosition,
  TurnaroundMilestone,
  MilestoneStatus,
  AgentSession,
  TaskPriority
} from '../types';
import { soundManager } from '../utils/audio';
import { api } from '../services/api';

// RBAC Permissions Mapping
export const ROLE_PERMISSIONS: Record<UserRole, UserPermission> = {
  'Administrator': {
    canCreateFlight: true,
    canEditFlight: true,
    canLockFlight: true,
    canScanSorting: true,
    canScanLoading: true,
    canManageUsers: true,
    canManageCompanies: true,
    canManageDollies: true,
    canViewAuditLogs: true,
    canResolveDiscrepancy: true,
  },
  'Sorting Agent': {
    canCreateFlight: false,
    canEditFlight: false,
    canLockFlight: false,
    canScanSorting: true,
    canScanLoading: false,
    canManageUsers: false,
    canManageCompanies: false,
    canManageDollies: true,
    canViewAuditLogs: false,
    canResolveDiscrepancy: false,
  },
  'Subplane Agent': {
    canCreateFlight: false,
    canEditFlight: false,
    canLockFlight: false,
    canScanSorting: true,
    canScanLoading: true,
    canManageUsers: false,
    canManageCompanies: false,
    canManageDollies: true,
    canViewAuditLogs: false,
    canResolveDiscrepancy: true,
  },
  'Ramp/Loading Agent': {
    canCreateFlight: false,
    canEditFlight: false,
    canLockFlight: false,
    canScanSorting: false,
    canScanLoading: true,
    canManageUsers: false,
    canManageCompanies: false,
    canManageDollies: true,
    canViewAuditLogs: false,
    canResolveDiscrepancy: true,
  },
  'Auditor': {
    canCreateFlight: false,
    canEditFlight: false,
    canLockFlight: false,
    canScanSorting: false,
    canScanLoading: false,
    canManageUsers: false,
    canManageCompanies: false,
    canManageDollies: false,
    canViewAuditLogs: true,
    canResolveDiscrepancy: false,
  }
};

// Initial Staff Users
const initialUsers: User[] = [
  {
    id: 'USR-001',
    name: 'Slimane Soltane',
    email: 's.soltane@soltane-aviation.com',
    badgeId: 'SAS-A-1001',
    role: 'Administrator',
    department: 'Ground Operations Management',
    assignedZone: 'Central Command & Terminal 1',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    status: 'on_shift',
    lastLogin: '2026-08-17 13:45',
    bagsScannedToday: 142,
    flightsHandled: 12,
    assignedFlightNbr: 'TU-720',
    assignedTasksCount: 4
  },
  {
    id: 'USR-002',
    name: 'Karim Ben Ali',
    email: 'k.benali@soltane-aviation.com',
    badgeId: 'SAS-S-2041',
    role: 'Sorting Agent',
    department: 'Baggage Sorting & Makeup Area',
    assignedZone: 'Sorting Carousel 02 & East Makeup',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    status: 'on_shift',
    lastLogin: '2026-08-17 12:10',
    bagsScannedToday: 384,
    flightsHandled: 6,
    assignedFlightNbr: 'TU-720',
    assignedTasksCount: 2
  },
  {
    id: 'USR-003',
    name: 'Mehdi Mansour',
    email: 'm.mansour@soltane-aviation.com',
    badgeId: 'SAS-P-3082',
    role: 'Subplane Agent',
    department: 'Subplane & Apron Transfer',
    assignedZone: 'Subplane Stand 14 & Stand 18',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    status: 'on_shift',
    lastLogin: '2026-08-17 11:30',
    bagsScannedToday: 215,
    flightsHandled: 5,
    assignedFlightNbr: 'AF-1482',
    assignedTasksCount: 3
  },
  {
    id: 'USR-004',
    name: 'Yassine Trabelsi',
    email: 'y.trabelsi@soltane-aviation.com',
    badgeId: 'SAS-R-4019',
    role: 'Ramp/Loading Agent',
    department: 'Ramp Hold Cargo Loading',
    assignedZone: 'Apron Gate A4 / Stand 14',
    avatarUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80',
    status: 'on_shift',
    lastLogin: '2026-08-17 13:05',
    bagsScannedToday: 198,
    flightsHandled: 4,
    assignedFlightNbr: 'TU-720',
    assignedTasksCount: 5,
    assignedMilestones: ['HOLD_OPEN', 'BAG_OFFLOAD_START', 'BAG_LOAD_START', 'BAG_LOAD_END', 'HOLD_CLOSED']
  },
  {
    id: 'USR-005',
    name: 'Amira Khelifi',
    email: 'a.khelifi@soltane-aviation.com',
    badgeId: 'SAS-Q-5099',
    role: 'Auditor',
    department: 'Safety, Security & Quality Audit',
    assignedZone: 'All Terminal & Ramp Zones',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    status: 'on_shift',
    lastLogin: '2026-08-17 10:15',
    bagsScannedToday: 0,
    flightsHandled: 15,
    assignedTasksCount: 1
  },
  {
    id: 'USR-006',
    name: 'Tarak Chaabane',
    email: 't.chaabane@soltane-aviation.com',
    badgeId: 'SAS-R-4028',
    role: 'Ramp/Loading Agent',
    department: 'Ramp Hold Cargo Loading',
    assignedZone: 'Apron Stand 18 & Remote R2',
    avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
    status: 'on_shift',
    lastLogin: '2026-08-17 13:20',
    bagsScannedToday: 156,
    flightsHandled: 3,
    assignedFlightNbr: 'AF-1482',
    assignedTasksCount: 4,
    assignedMilestones: ['HOLD_OPEN', 'BAG_LOAD_START', 'BAG_LOAD_END', 'HOLD_CLOSED']
  }
];

// Initial Airlines / Companies
const initialCompanies: Company[] = [
  {
    id: 'CMP-01',
    name: 'Tunisair',
    abbreviation: 'TU',
    iata: 'TU',
    icao: 'TAR',
    logo: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=120&auto=format&fit=crop&q=80',
    hub: 'Tunis-Carthage International (TUN)',
    contactEmail: 'ground.ops@tunisair.com.tn',
    contactPhone: '+216 70 837 000',
    activeFlightsCount: 14,
    slaComplianceRate: 99.1
  },
  {
    id: 'CMP-02',
    name: 'Air France',
    abbreviation: 'AF',
    iata: 'AF',
    icao: 'AFR',
    logo: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=120&auto=format&fit=crop&q=80',
    hub: 'Paris Charles de Gaulle (CDG)',
    contactEmail: 'handling.cdg@airfrance.fr',
    contactPhone: '+33 1 41 56 78 00',
    activeFlightsCount: 8,
    slaComplianceRate: 98.4
  },
  {
    id: 'CMP-03',
    name: 'Nouvelair',
    abbreviation: 'BJ',
    iata: 'BJ',
    icao: 'LBT',
    logo: 'https://images.unsplash.com/photo-1583416750470-965b2707b355?w=120&auto=format&fit=crop&q=80',
    hub: 'Monastir Habib Bourguiba (MIR)',
    contactEmail: 'ops@nouvelair.com',
    contactPhone: '+216 70 020 920',
    activeFlightsCount: 6,
    slaComplianceRate: 97.9
  },
  {
    id: 'CMP-04',
    name: 'Emirates',
    abbreviation: 'EK',
    iata: 'EK',
    icao: 'UAE',
    logo: 'https://images.unsplash.com/photo-1520437358207-323b43b50729?w=120&auto=format&fit=crop&q=80',
    hub: 'Dubai International (DXB)',
    contactEmail: 'cargo.station@emirates.com',
    contactPhone: '+971 4 286 4066',
    activeFlightsCount: 4,
    slaComplianceRate: 99.7
  },
  {
    id: 'CMP-05',
    name: 'Saudia',
    abbreviation: 'SV',
    iata: 'SV',
    icao: 'SVA',
    logo: 'https://images.unsplash.com/photo-1569154941061-e231b4725ef1?w=120&auto=format&fit=crop&q=80',
    hub: 'King Abdulaziz Int. Airport (JED)',
    contactEmail: 'ops.support@saudia.com',
    contactPhone: '+966 9200 22222',
    activeFlightsCount: 3,
    slaComplianceRate: 98.8
  }
];

// Initial Dollies
const initialDollies: Dolly[] = [
  {
    id: 'DLY-101',
    type: 'Container AKE',
    maxCapacity: 45,
    currentBagsCount: 32,
    assignedFlightNbr: 'TU-720',
    zone: 'Sorting Area Carousel 02',
    status: 'Loading',
    lastUpdated: '2026-08-17 13:40',
    tareWeightKg: 85,
    bags: ['0057128401', '0057128402', '0057128403', '0057128404']
  },
  {
    id: 'DLY-102',
    type: 'Container AKE',
    maxCapacity: 45,
    currentBagsCount: 16,
    assignedFlightNbr: 'TU-720',
    zone: 'Subplane Stand 14',
    status: 'In Transit',
    lastUpdated: '2026-08-17 13:42',
    tareWeightKg: 85,
    bags: ['0057128405', '0057128406']
  },
  {
    id: 'DLY-103',
    type: 'Open Dolly',
    maxCapacity: 35,
    currentBagsCount: 28,
    assignedFlightNbr: 'AF-1482',
    zone: 'Stand 18 Aircraft Hold',
    status: 'At Aircraft Hold',
    lastUpdated: '2026-08-17 13:35',
    tareWeightKg: 60,
    bags: ['0057128450', '0057128451', '0057128452']
  },
  {
    id: 'DLY-104',
    type: 'Bulk Cart',
    maxCapacity: 30,
    currentBagsCount: 0,
    assignedFlightNbr: undefined,
    zone: 'Dolly Parking Apron South',
    status: 'Available',
    lastUpdated: '2026-08-17 11:00',
    tareWeightKg: 70,
    bags: []
  },
  {
    id: 'DLY-105',
    type: 'Pallet Trailer',
    maxCapacity: 60,
    currentBagsCount: 42,
    assignedFlightNbr: 'EK-748',
    zone: 'East Makeup Zone B',
    status: 'Loading',
    lastUpdated: '2026-08-17 13:15',
    tareWeightKg: 120,
    bags: []
  }
];

// Initial Flights
const initialFlights: Flight[] = [
  {
    id: 'FLT-QR123',
    date: '2026-08-17',
    flightNbr: 'QR123',
    flightTask: 'Widebody Fast Turnaround & Dual Hold Loading',
    paxNbrDep: 312,
    paxNbrArr: 295,
    gateNbr: 'C12',
    flightType: 'Commercial Pax',
    acType: 'A350-1000',
    checkInStartTime: '12:30',
    sta: '13:30',
    std: '15:15',
    companyName: 'Qatar Airways',
    companyLogo: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=120&auto=format&fit=crop&q=80',
    reg: 'A7-ANE',
    subplaneAreaZone: 'Ramp 42',
    sortingAreaZone: 'Widebody Makeup Bay 1',
    sortingAreaUser: 'Karim Ben Ali',
    subplaneAreaUser: 'Mehdi Mansour',
    assignedRampAgent: 'Yassine Trabelsi',
    assignedRampAgentBadge: 'SAS-R-4019',
    createdBy: 'Slimane Soltane',
    status: 'Loading',
    isLocked: false,
    totalBagsExpected: 42,
    bagsSortedCount: 42,
    bagsLoadedCount: 38,
    comments: [
      {
        id: 'C-QR-01',
        authorId: 'USR-004',
        authorName: 'Yassine Trabelsi',
        authorRole: 'Ramp/Loading Agent',
        timestamp: '2026-08-17 13:44',
        message: 'Bag offload completed. Outbound Hold 1 Fwd loading in progress.',
        category: 'loading'
      }
    ],
    dollyIds: ['DLY-101', 'DLY-102']
  },
  {
    id: 'FLT-001',
    date: '2026-08-17',
    flightNbr: 'TU-720',
    flightTask: 'Full Turnaround & Baggage Sorting/Loading',
    paxNbrDep: 156,
    paxNbrArr: 142,
    gateNbr: 'A04',
    flightType: 'Commercial Pax',
    acType: 'A320neo',
    checkInStartTime: '12:00',
    sta: '13:10',
    std: '14:30',
    companyName: 'Tunisair',
    companyLogo: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=120&auto=format&fit=crop&q=80',
    reg: 'TS-IMU',
    subplaneAreaZone: 'Stand 14',
    sortingAreaZone: 'Carousel 02 - Zone North',
    sortingAreaUser: 'Karim Ben Ali',
    subplaneAreaUser: 'Mehdi Mansour',
    createdBy: 'Slimane Soltane',
    status: 'Loading',
    isLocked: false,
    totalBagsExpected: 24,
    bagsSortedCount: 24,
    bagsLoadedCount: 18,
    comments: [
      {
        id: 'C-01',
        authorId: 'USR-002',
        authorName: 'Karim Ben Ali',
        authorRole: 'Sorting Agent',
        timestamp: '2026-08-17 13:12',
        message: 'All 24 checked bags sorted and dispatched via Dolly DLY-101 and DLY-102.',
        category: 'loading'
      },
      {
        id: 'C-02',
        authorId: 'USR-004',
        authorName: 'Yassine Trabelsi',
        authorRole: 'Ramp/Loading Agent',
        timestamp: '2026-08-17 13:30',
        message: '18 bags stowed into Hold 1 Fwd. Awaiting final 6 bags from subplane buffer.',
        category: 'loading'
      }
    ],
    dollyIds: ['DLY-101', 'DLY-102']
  },
  {
    id: 'FLT-002',
    date: '2026-08-17',
    flightNbr: 'AF-1482',
    flightTask: 'Express Loading & Security Screening',
    paxNbrDep: 128,
    paxNbrArr: 110,
    gateNbr: 'B07',
    flightType: 'Commercial Pax',
    acType: 'A321-200',
    checkInStartTime: '11:30',
    sta: '12:45',
    std: '14:05',
    companyName: 'Air France',
    companyLogo: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=120&auto=format&fit=crop&q=80',
    reg: 'F-GTAU',
    subplaneAreaZone: 'Stand 18',
    sortingAreaZone: 'East Sorter Makeup Carousel 03',
    sortingAreaUser: 'Karim Ben Ali',
    subplaneAreaUser: 'Mehdi Mansour',
    createdBy: 'Slimane Soltane',
    status: 'Loading',
    isLocked: false,
    totalBagsExpected: 20,
    bagsSortedCount: 20,
    bagsLoadedCount: 17,
    comments: [
      {
        id: 'C-03',
        authorId: 'USR-004',
        authorName: 'Yassine Trabelsi',
        authorRole: 'Ramp/Loading Agent',
        timestamp: '2026-08-17 13:40',
        message: 'DISCREPANCY ALERT: 3 bags missing during Hold 2 Aft loading verification! Search in progress.',
        category: 'discrepancy'
      }
    ],
    dollyIds: ['DLY-103']
  },
  {
    id: 'FLT-003',
    date: '2026-08-17',
    flightNbr: 'BJ-512',
    flightTask: 'Standard Handling & Priority Bag Transfer',
    paxNbrDep: 180,
    paxNbrArr: 175,
    gateNbr: 'A12',
    flightType: 'Commercial Pax',
    acType: 'A320neo',
    checkInStartTime: '09:00',
    sta: '10:15',
    std: '11:45',
    companyName: 'Nouvelair',
    companyLogo: 'https://images.unsplash.com/photo-1583416750470-965b2707b355?w=120&auto=format&fit=crop&q=80',
    reg: 'TS-INB',
    subplaneAreaZone: 'Stand 08',
    sortingAreaZone: 'Make-up Carousel 01',
    sortingAreaUser: 'Karim Ben Ali',
    subplaneAreaUser: 'Mehdi Mansour',
    createdBy: 'Slimane Soltane',
    status: 'Departed',
    isLocked: true,
    totalBagsExpected: 30,
    bagsSortedCount: 30,
    bagsLoadedCount: 30,
    comments: [
      {
        id: 'C-04',
        authorId: 'USR-001',
        authorName: 'Slimane Soltane',
        authorRole: 'Administrator',
        timestamp: '2026-08-17 11:40',
        message: '100% Bag reconciliation confirmed. Flight closed and locked.',
        category: 'general'
      }
    ],
    dollyIds: []
  },
  {
    id: 'FLT-004',
    date: '2026-08-17',
    flightNbr: 'EK-748',
    flightTask: 'Heavy Widebody Cargo & Passenger Handling',
    paxNbrDep: 340,
    paxNbrArr: 310,
    gateNbr: 'C02',
    flightType: 'Commercial Pax',
    acType: 'B777-300ER',
    checkInStartTime: '13:00',
    sta: '14:50',
    std: '16:45',
    companyName: 'Emirates',
    companyLogo: 'https://images.unsplash.com/photo-1520437358207-323b43b50729?w=120&auto=format&fit=crop&q=80',
    reg: 'A6-EQL',
    subplaneAreaZone: 'Remote Apron R4',
    sortingAreaZone: 'Widebody Makeup Bay 4',
    sortingAreaUser: 'Karim Ben Ali',
    subplaneAreaUser: 'Mehdi Mansour',
    createdBy: 'Slimane Soltane',
    status: 'Sorting',
    isLocked: false,
    totalBagsExpected: 40,
    bagsSortedCount: 22,
    bagsLoadedCount: 0,
    comments: [],
    dollyIds: ['DLY-105']
  },
  {
    id: 'FLT-005',
    date: '2026-08-17',
    flightNbr: 'SV-381',
    flightTask: 'Charter / Umrah Ground Ops',
    paxNbrDep: 290,
    paxNbrArr: 280,
    gateNbr: 'A02',
    flightType: 'VIP/Charter',
    acType: 'B787-9',
    checkInStartTime: '15:00',
    sta: '17:00',
    std: '18:50',
    companyName: 'Saudia',
    companyLogo: 'https://images.unsplash.com/photo-1569154941061-e231b4725ef1?w=120&auto=format&fit=crop&q=80',
    reg: 'HZ-ARC',
    subplaneAreaZone: 'Stand 12',
    sortingAreaZone: 'Carousel 04',
    sortingAreaUser: 'Karim Ben Ali',
    subplaneAreaUser: 'Mehdi Mansour',
    createdBy: 'Slimane Soltane',
    status: 'Scheduled',
    isLocked: false,
    totalBagsExpected: 35,
    bagsSortedCount: 0,
    bagsLoadedCount: 0,
    comments: [],
    dollyIds: []
  }
];

// Helper to generate bag dataset for TU-720 and AF-1482
const generateInitialBags = (): Baggage[] => {
  const bags: Baggage[] = [];

  // TU-720: 24 bags (18 loaded, 6 sorted but pending load)
  for (let i = 1; i <= 24; i++) {
    const tagNum = `00571284${i < 10 ? '0' + i : i}`;
    const isLoaded = i <= 18;
    const names = [
      'Jean Dupont', 'Mohamed Larbi', 'Sarah Connor', 'Anis Gharbi', 'Elena Rostova',
      'Omar Farouk', 'Sophie Marceau', 'Khaled Jendoubi', 'Nathalie Baye', 'Tarek Chaari',
      'Marc Levy', 'Fatima Zahra', 'David Miller', 'Leila Trabelsi', 'Paul Simon',
      'Amine Cherif', 'Claire Denis', 'Nader Khemir', 'Emma Watson', 'Youssef Chahine',
      'Marie Curie', 'Hassen Baccouche', 'Lucas Martin', 'Syrine Ben Salah'
    ];

    bags.push({
      id: `BAG-TU-${i}`,
      tagNumber: tagNum,
      flightNbr: 'TU-720',
      passengerName: names[i - 1] || `Passenger ${i}`,
      seatNumber: `${Math.floor(i / 6) + 1}${['A', 'B', 'C', 'D', 'E', 'F'][i % 6]}`,
      destination: 'Paris (CDG)',
      classType: i <= 4 ? 'Business' : i === 5 ? 'Priority' : 'Economy',
      weightKg: 16 + (i % 12),
      status: isLoaded ? 'LOADED' : 'SORTED',
      sortingZone: 'Carousel 02 - Zone North',
      sortingUser: 'Karim Ben Ali',
      sortingTimestamp: `2026-08-17 12:${30 + (i % 25)}`,
      loadingZone: isLoaded ? 'Stand 14 Cargo Hold' : undefined,
      loadingUser: isLoaded ? 'Yassine Trabelsi' : undefined,
      loadingTimestamp: isLoaded ? `2026-08-17 13:${15 + (i % 20)}` : undefined,
      dollyId: i <= 12 ? 'DLY-101' : 'DLY-102',
      holdLocation: isLoaded ? (i <= 10 ? 'Hold 1 Fwd' : 'Hold 2 Aft') : 'Unassigned',
      isRush: i === 5,
      isHeavy: (16 + (i % 12)) > 23,
      isFragile: i === 3,
      comments: i === 3 ? [
        {
          id: 'BC-01',
          authorId: 'USR-002',
          authorName: 'Karim Ben Ali',
          authorRole: 'Sorting Agent',
          timestamp: '2026-08-17 12:40',
          text: 'Fragile label attached. Placed on top of Dolly DLY-101.',
          isDiscrepancy: false
        }
      ] : []
    });
  }

  // AF-1482: 20 bags (17 loaded, 3 missing / not scanned at hold to trigger missing bag reconciliation alert)
  for (let i = 1; i <= 20; i++) {
    const tagNum = `00571990${i < 10 ? '0' + i : i}`;
    const isMissing = i >= 18; // Bags 18, 19, 20 missing at loading!
    const isLoaded = !isMissing;
    const names = [
      'Philippe Noiret', 'Aida Toumi', 'Julien Clerc', 'Bilel Ayari', 'Catherine Deneuve',
      'Karim Sassi', 'Audrey Tautou', 'Walid Bouaziz', 'Vincent Cassel', 'Mouna Nouri',
      'Romain Duris', 'Zied Mejri', 'Marion Cotillard', 'Hamza Dridi', 'Alain Delon',
      'Sami Karray', 'Eva Green', 'Hichem Rostom', 'Guillaume Canet', 'Rim Riahi'
    ];

    bags.push({
      id: `BAG-AF-${i}`,
      tagNumber: tagNum,
      flightNbr: 'AF-1482',
      passengerName: names[i - 1] || `Pax AF ${i}`,
      seatNumber: `${Math.floor(i / 6) + 4}${['A', 'B', 'C', 'D', 'E', 'F'][i % 6]}`,
      destination: 'Nice (NCE)',
      classType: i === 1 ? 'Business' : 'Economy',
      weightKg: 18 + (i % 10),
      status: isLoaded ? 'LOADED' : 'MISSING',
      sortingZone: 'East Sorter Makeup Carousel 03',
      sortingUser: 'Karim Ben Ali',
      sortingTimestamp: `2026-08-17 12:${10 + (i % 20)}`,
      loadingZone: isLoaded ? 'Stand 18 Aircraft Hold' : undefined,
      loadingUser: isLoaded ? 'Yassine Trabelsi' : undefined,
      loadingTimestamp: isLoaded ? `2026-08-17 13:${20 + (i % 15)}` : undefined,
      dollyId: 'DLY-103',
      holdLocation: isLoaded ? 'Hold 2 Aft' : 'Unassigned',
      isRush: false,
      isHeavy: false,
      isFragile: false,
      comments: isMissing ? [
        {
          id: `BC-MIS-${i}`,
          authorId: 'USR-004',
          authorName: 'Yassine Trabelsi',
          authorRole: 'Ramp/Loading Agent',
          timestamp: '2026-08-17 13:42',
          text: `Bag not found in Dolly DLY-103 during Hold 2 stowing. Checked makeup buffer.`,
          isDiscrepancy: true
        }
      ] : [],
      alerts: isMissing ? ['AUTOMATIC_RECONCILIATION_UNLOADED_WARNING'] : []
    });
  }

  return bags;
};

// Initial Flight Tasks
const initialFlightTasks: FlightTaskItem[] = [
  {
    id: 'TSK-01',
    flightNbr: 'TU-720',
    taskTitle: 'Sorting Makeup & Dolly Allocation',
    category: 'Sorting',
    assignedRole: 'Sorting Agent',
    assignedUserId: 'USR-002',
    assignedUserName: 'Karim Ben Ali',
    status: 'Completed',
    priority: 'High',
    targetTime: '13:00',
    completedAt: '2026-08-17 12:55',
    checklist: [
      { id: 'c1', text: 'Assign Dolly DLY-101 and DLY-102', done: true },
      { id: 'c2', text: 'Scan all 24 check-in tags at Sorter 02', done: true },
      { id: 'c3', text: 'Secure waterproof nets on containers', done: true }
    ],
    notes: 'Dispatched to apron ahead of schedule.'
  },
  {
    id: 'TSK-02',
    flightNbr: 'TU-720',
    taskTitle: 'Aircraft Hold Cargo Loading & Zebra Scan',
    category: 'Loading',
    assignedRole: 'Ramp/Loading Agent',
    assignedUserId: 'USR-004',
    assignedUserName: 'Yassine Trabelsi',
    status: 'In Progress',
    priority: 'Critical',
    targetTime: '14:00',
    checklist: [
      { id: 'c4', text: 'Inspect Hold 1 Fwd & Hold 2 Aft latches', done: true },
      { id: 'c5', text: 'Scan each bag at cargo door with Zebra TC57', done: false },
      { id: 'c6', text: 'Reconcile scanned count against BSM manifest', done: false }
    ],
    notes: '18/24 bags loaded into Hold 1.'
  },
  {
    id: 'TSK-03',
    flightNbr: 'AF-1482',
    taskTitle: 'Reconcile Missing Bags & Seal Hold',
    category: 'Reconciliation',
    assignedRole: 'Ramp/Loading Agent',
    assignedUserId: 'USR-004',
    assignedUserName: 'Yassine Trabelsi',
    status: 'Delayed',
    priority: 'Critical',
    targetTime: '13:50',
    checklist: [
      { id: 'c7', text: 'Locate 3 un-scanned bags (0057199018, 19, 20)', done: false },
      { id: 'c8', text: 'Contact Sorting Agent for makeup re-check', done: true },
      { id: 'c9', text: 'Obtain Captain loadsheet sign-off', done: false }
    ],
    notes: 'Alert active: 3 tags not verified at aircraft hold.'
  },
  {
    id: 'TSK-04',
    flightNbr: 'BJ-512',
    taskTitle: 'Ramp Departure Clearance & Log Lock',
    category: 'Departure',
    assignedRole: 'Administrator',
    assignedUserId: 'USR-001',
    assignedUserName: 'Slimane Soltane',
    status: 'Completed',
    priority: 'Normal',
    targetTime: '11:40',
    completedAt: '2026-08-17 11:42',
    checklist: [
      { id: 'c10', text: '100% Bag reconciliation verified', done: true },
      { id: 'c11', text: 'Flight record locked against further edits', done: true }
    ],
    notes: 'Departed on time.'
  }
];

// Initial Audit Trail
const initialAuditLogs: AuditLog[] = [
  {
    id: 'AUD-901',
    timestamp: '2026-08-17 13:42:10',
    userId: 'USR-004',
    userName: 'Yassine Trabelsi',
    userRole: 'Ramp/Loading Agent',
    module: 'Baggage',
    actionType: 'RECONCILE_ALERT',
    entityId: 'AF-1482',
    details: 'Automatic reconciliation alert: 3 checked bags (0057199018, 0057199019, 0057199020) missing at Stand 18 aircraft hold.',
    severity: 'critical',
    device: 'Zebra TC57 Handheld #R04'
  },
  {
    id: 'AUD-902',
    timestamp: '2026-08-17 13:30:15',
    userId: 'USR-004',
    userName: 'Yassine Trabelsi',
    userRole: 'Ramp/Loading Agent',
    module: 'Baggage',
    actionType: 'SCAN_STEP2',
    entityId: '0057128418',
    details: 'Step 2 Loading Scan: Bag 0057128418 (Pax: Hassen Baccouche) verified & stowed in TU-720 Hold 1 Fwd.',
    previousState: 'SORTED',
    newState: 'LOADED',
    severity: 'success',
    device: 'Zebra TC57 Handheld #R04'
  },
  {
    id: 'AUD-903',
    timestamp: '2026-08-17 13:12:00',
    userId: 'USR-002',
    userName: 'Karim Ben Ali',
    userRole: 'Sorting Agent',
    module: 'Baggage',
    actionType: 'SCAN_STEP1',
    entityId: '0057128424',
    details: 'Step 1 Sorting Scan: Bag 0057128424 (Pax: Syrine Ben Salah) scanned at Carousel 02 and assigned to Dolly DLY-102.',
    previousState: 'CHECKED_IN',
    newState: 'SORTED',
    severity: 'info',
    device: 'Zebra MC3300 Fixed Terminal #S02'
  },
  {
    id: 'AUD-904',
    timestamp: '2026-08-17 12:05:22',
    userId: 'USR-001',
    userName: 'Slimane Soltane',
    userRole: 'Administrator',
    module: 'Flight',
    actionType: 'CREATE',
    entityId: 'TU-720',
    details: 'Flight TU-720 profile created with 24 expected bags. Gate A04, Stand 14 assigned.',
    severity: 'info',
    device: 'Central Desktop Terminal #01'
  },
  {
    id: 'AUD-905',
    timestamp: '2026-08-17 11:42:00',
    userId: 'USR-001',
    userName: 'Slimane Soltane',
    userRole: 'Administrator',
    module: 'Flight',
    actionType: 'LOCK',
    entityId: 'BJ-512',
    details: 'Flight BJ-512 locked upon departure after 100% reconciliation confirmation.',
    previousState: 'Reconciled',
    newState: 'Departed / Locked',
    severity: 'success',
    device: 'Central Desktop Terminal #01'
  }
];

// Initial Session Logs
const initialSessionLogs: UserSessionLog[] = [
  {
    id: 'SES-01',
    userId: 'USR-001',
    userName: 'Slimane Soltane',
    role: 'Administrator',
    loginTime: '2026-08-17 07:30',
    ipAddress: '192.168.10.45',
    device: 'Desktop Command Terminal #01 (Chrome/Windows)',
    actionsPerformed: 54,
    status: 'active'
  },
  {
    id: 'SES-02',
    userId: 'USR-002',
    userName: 'Karim Ben Ali',
    role: 'Sorting Agent',
    loginTime: '2026-08-17 08:00',
    ipAddress: '192.168.10.112',
    device: 'Zebra MC3300 Touch Computer #S02 (Android Enterprise)',
    actionsPerformed: 384,
    status: 'active'
  },
  {
    id: 'SES-03',
    userId: 'USR-004',
    userName: 'Yassine Trabelsi',
    role: 'Ramp/Loading Agent',
    loginTime: '2026-08-17 08:15',
    ipAddress: '192.168.10.144',
    device: 'Zebra TC57 Rugged Scanner #R04 (Android 11)',
    actionsPerformed: 198,
    status: 'active'
  }
];

// Initial Turnaround Milestones Generator
const generateInitialMilestones = (): TurnaroundMilestone[] => {
  const milestoneTemplates = [
    { code: 'ATA', title: 'Actual Time of Arrival (Touchdown)', category: 'Arrival' as const, offset: -50, defaultTime: '13:08' },
    { code: 'CHOCKS_ON', title: 'Aircraft Chocks On & Marshaling', category: 'Arrival' as const, offset: -45, defaultTime: '13:10' },
    { code: 'BRIDGE_STAIRS', title: 'Passenger Boarding Bridge / Stairs Positioned', category: 'Arrival' as const, offset: -43, defaultTime: '13:12' },
    { code: 'DISEMBARK_START', title: 'Inbound Passenger Disembarkation Commenced', category: 'Arrival' as const, offset: -40, defaultTime: '13:14' },
    { code: 'GPU_CONNECTED', title: 'Ground Power Unit (GPU) & AC Air Connected', category: 'Servicing' as const, offset: -42, defaultTime: '13:13' },
    { code: 'HOLD_OPEN', title: 'Cargo Hold Doors Opened & Safety Barrier Set', category: 'Baggage' as const, offset: -38, defaultTime: '13:15' },
    { code: 'BAG_OFFLOAD_START', title: 'Inbound Baggage Offloading Commenced', category: 'Baggage' as const, offset: -35, defaultTime: '13:17' },
    { code: 'BAG_OFFLOAD_END', title: 'Inbound Baggage Offload Completed', category: 'Baggage' as const, offset: -25, defaultTime: '13:25' },
    { code: 'CABIN_CLEAN_IN', title: 'Cabin Cleaning & Security Search In', category: 'Cleaning' as const, offset: -25, defaultTime: '13:26' },
    { code: 'WATER_LAV', title: 'Potable Water & Toilet Waste Servicing', category: 'Servicing' as const, offset: -20, defaultTime: '13:30' },
    { code: 'REFUELING_START', title: 'Aircraft Refueling Service Commenced', category: 'Fueling' as const, offset: -18, defaultTime: '13:32' },
    { code: 'REFUELING_END', title: 'Refueling Completed & Fuel Slip Verified', category: 'Fueling' as const, offset: -5, defaultTime: '13:42' },
    { code: 'CABIN_CLEAN_OUT', title: 'Cabin Security Clearance & Ready for Boarding', category: 'Cleaning' as const, offset: -12, defaultTime: '13:38' },
    { code: 'CATERING_DELIVERY', title: 'Inflight Catering Galleys Stowed', category: 'Servicing' as const, offset: -10, defaultTime: '13:40' },
    { code: 'BAG_LOAD_START', title: 'Outbound Baggage Loading Commenced (Hold 1/2)', category: 'Baggage' as const, offset: -15, defaultTime: '13:35' },
    { code: 'BAG_LOAD_END', title: 'Outbound Baggage Loading Completed & Verified', category: 'Baggage' as const, offset: -2, defaultTime: '13:48' },
    { code: 'BOARDING_START', title: 'Outbound Passenger Boarding Gate Open', category: 'Boarding' as const, offset: -15, defaultTime: '13:35' },
    { code: 'BOARDING_END', title: 'Boarding Gate Closed & Headcount Reconciled', category: 'Boarding' as const, offset: -3, defaultTime: '13:47' },
    { code: 'HOLD_CLOSED', title: 'Cargo Hold Netting Locked & Doors Sealed', category: 'Departure' as const, offset: -1, defaultTime: '13:49' },
    { code: 'PUSHBACK_START', title: 'Tug Connected & Pushback Clearance Given', category: 'Departure' as const, offset: 0, defaultTime: '13:50' },
    { code: 'ATD', title: 'Actual Time of Departure (Airborne)', category: 'Departure' as const, offset: +10, defaultTime: '14:00' }
  ];

  const initialList: TurnaroundMilestone[] = [];
  const sampleFlights = ['QR123', 'TU-720', 'AF-1482', 'BJ-512', 'EK-748', 'SV-381'];

  sampleFlights.forEach((fNbr) => {
    milestoneTemplates.forEach((t, idx) => {
      const isQr = fNbr === 'QR123';
      const isTu = fNbr === 'TU-720';
      const isBj = fNbr === 'BJ-512';
      const isCompleted = isBj || (isTu && idx <= 15) || (isQr && [0, 1, 2, 4, 5, 6, 7, 9, 12, 13].includes(idx));
      const isInProgress = (isTu && idx === 16) || (isQr && idx === 8);
      
      initialList.push({
        id: `MLS-${fNbr}-${t.code}`,
        flightNbr: fNbr,
        code: t.code,
        title: t.title,
        category: t.category,
        targetOffsetMinutes: t.offset,
        scheduledTime: t.defaultTime,
        actualTime: isCompleted ? t.defaultTime : undefined,
        timestampExact: isCompleted ? `2026-08-17T${t.defaultTime}:00.412Z` : undefined,
        status: isCompleted ? 'COMPLETED' : isInProgress ? 'IN_PROGRESS' : 'PENDING',
        completedByUserId: isCompleted ? (idx % 2 === 0 ? 'USR-003' : 'USR-004') : undefined,
        completedByUserName: isCompleted ? (idx % 2 === 0 ? 'Mehdi Mansour' : 'Yassine Trabelsi') : undefined,
        completedByUserRole: isCompleted ? (idx % 2 === 0 ? 'Subplane Agent' : 'Ramp/Loading Agent') : undefined,
        gpsLatitude: isCompleted ? 36.8512 + (idx * 0.00008) : undefined,
        gpsLongitude: isCompleted ? 10.2274 + (idx * 0.00006) : undefined,
        gpsAccuracyMeters: isCompleted ? 1.8 : undefined,
        rampStand: isTu ? 'Stand 14 - Apron South' : 'Stand 18',
        notes: isCompleted ? `Milestone confirmed on apron by handheld scanner.` : undefined
      });
    });
  });

  return initialList;
};

// Initial Active Agent Field Sessions
const initialAgentSessions: AgentSession[] = [
  {
    sessionId: 'SES-FLD-01',
    flightId: 'FLT-001',
    flightNbr: 'TU-720',
    agentId: 'USR-004',
    agentName: 'Yassine Trabelsi',
    agentRole: 'Ramp/Loading Agent',
    badgeId: 'SAS-R-4019',
    startedAt: '2026-08-17 12:45',
    lastPingAt: '2026-08-17 13:44:12',
    deviceModel: 'Zebra TC57x Rugged Barcode Computer (SN: ZEB-7890)',
    batteryLevel: 88,
    signalStrength: 'Strong',
    currentGps: {
      latitude: 36.85124,
      longitude: 10.22742,
      accuracy: 1.8,
      zoneName: 'Stand 14 - Hold 1 Fwd Cargo Door'
    },
    isActive: true,
    assignedMilestones: ['HOLD_OPEN', 'BAG_OFFLOAD_START', 'BAG_LOAD_START', 'BAG_LOAD_END', 'HOLD_CLOSED']
  },
  {
    sessionId: 'SES-FLD-02',
    flightId: 'FLT-001',
    flightNbr: 'TU-720',
    agentId: 'USR-003',
    agentName: 'Mehdi Mansour',
    agentRole: 'Subplane Agent',
    badgeId: 'SAS-P-3082',
    startedAt: '2026-08-17 12:30',
    lastPingAt: '2026-08-17 13:43:55',
    deviceModel: 'Zebra TC77 Touch Computer (SN: ZEB-5512)',
    batteryLevel: 94,
    signalStrength: 'Strong',
    currentGps: {
      latitude: 36.85118,
      longitude: 10.22735,
      accuracy: 2.1,
      zoneName: 'Stand 14 - Subplane Apron Perimeter'
    },
    isActive: true,
    assignedMilestones: ['ATA', 'CHOCKS_ON', 'BRIDGE_STAIRS', 'DISEMBARK_START', 'PUSHBACK_START']
  },
  {
    sessionId: 'SES-FLD-03',
    flightId: 'FLT-001',
    flightNbr: 'TU-720',
    agentId: 'USR-002',
    agentName: 'Karim Ben Ali',
    agentRole: 'Sorting Agent',
    badgeId: 'SAS-S-2041',
    startedAt: '2026-08-17 12:15',
    lastPingAt: '2026-08-17 13:40:02',
    deviceModel: 'Zebra MC3300 Fixed Terminal #S02',
    batteryLevel: 100,
    signalStrength: 'Strong',
    currentGps: {
      latitude: 36.85210,
      longitude: 10.22680,
      accuracy: 1.2,
      zoneName: 'Baggage Sorting Hall Carousel 02'
    },
    isActive: true,
    assignedMilestones: ['BAG_LOAD_START']
  }
];

interface AppContextType {
  // Current logged in user & Auth
  currentUser: User;
  setCurrentUser: (user: User) => void;
  userRole: UserRole;
  permissions: UserPermission;
  isAuthenticated: boolean;
  login: (identifier: string, password?: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  updateUserPermissions: (userId: string, customPermissions: Partial<UserPermission>) => void;

  // Active view tab
  activeTab: string;
  setActiveTab: (tab: string) => void;

  // Active selected flight for scanner / inspection
  selectedFlightId: string;
  setSelectedFlightId: (id: string) => void;
  selectedFlight: Flight | undefined;

  // Data Collections
  users: User[];
  companies: Company[];
  flights: Flight[];
  baggage: Baggage[];
  dollies: Dolly[];
  tasks: FlightTaskItem[];
  turnaroundMilestones: TurnaroundMilestone[];
  agentSessions: AgentSession[];
  auditLogs: AuditLog[];
  sessionLogs: UserSessionLog[];

  // Flight Actions
  addFlight: (flight: Omit<Flight, 'id' | 'bagsSortedCount' | 'bagsLoadedCount' | 'comments' | 'dollyIds' | 'isLocked'>) => Flight;
  updateFlight: (id: string, updates: Partial<Flight>) => void;
  lockFlight: (id: string) => void;
  unlockFlight: (id: string) => void;
  cancelFlight: (id: string, reason?: string) => void;
  deleteFlight: (id: string) => void;
  addFlightComment: (flightId: string, message: string, category: 'general' | 'discrepancy' | 'security' | 'loading' | 'delay') => void;

  // Turnaround Milestones & GPS Operations
  updateMilestoneStatus: (milestoneId: string, status: MilestoneStatus, customNotes?: string) => void;
  assignMilestoneAgent: (milestoneId: string, userId: string) => void;
  assignMultipleMilestonesToAgent: (flightNbr: string, milestoneCodes: string[], userId: string) => void;
  dispatchFlightToRampAgent: (params: {
    userId: string;
    flightId: string;
    milestoneCodes?: string[];
    taskTitle?: string;
    priority?: TaskPriority;
    targetTime?: string;
    notes?: string;
    checklist?: { id: string; text: string; done: boolean }[];
  }) => void;
  startAgentSession: (flightId: string, userId?: string) => AgentSession;
  pingAgentSessionGps: (sessionId: string, lat?: number, lng?: number) => void;
  endAgentSession: (sessionId: string) => void;

  // Baggage & Zebra Scanning Actions
  scanBagStep1: (tagNumber: string, flightNbr: string, sortingZone: string, dollyId?: string) => { success: boolean; message: string; bag?: Baggage };
  scanBagStep2: (tagNumber: string, flightNbr: string, holdLocation: HoldPosition) => { success: boolean; message: string; bag?: Baggage; isWrongFlight?: boolean; isDiscrepancy?: boolean };
  addBagComment: (bagId: string, text: string, isDiscrepancy: boolean) => void;
  resolveBagDiscrepancy: (bagId: string) => void;
  markBagOffloaded: (bagId: string, reason: string) => void;
  simulateBatchScan: (flightNbr: string, step: 1 | 2, count: number) => void;

  // Company Actions
  addCompany: (company: Omit<Company, 'id' | 'activeFlightsCount' | 'slaComplianceRate'>) => void;
  updateCompany: (id: string, updates: Partial<Company>) => void;
  deleteCompany: (id: string) => void;

  // Dolly Actions
  addDolly: (dolly: Omit<Dolly, 'id' | 'currentBagsCount' | 'lastUpdated' | 'bags'>) => void;
  updateDolly: (id: string, updates: Partial<Dolly>) => void;
  deleteDolly: (id: string) => void;
  assignDollyFlight: (dollyId: string, flightNbr?: string) => void;

  // User Actions
  addUser: (user: Omit<User, 'id' | 'bagsScannedToday' | 'flightsHandled'>) => void;
  updateUser: (id: string, updates: Partial<User>) => void;
  deleteUser: (id: string) => void;

  // Task Actions
  addTask: (task: Omit<FlightTaskItem, 'id' | 'completedAt'>) => void;
  updateTaskStatus: (taskId: string, status: FlightTaskItem['status']) => void;
  toggleTaskChecklist: (taskId: string, checklistId: string) => void;

  // Audit Logging
  logActivity: (
    module: AuditLog['module'],
    actionType: AuditLog['actionType'],
    entityId: string,
    details: string,
    severity?: AuditLog['severity'],
    previousState?: string,
    newState?: string
  ) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('sas_users');
    return saved ? JSON.parse(saved) : initialUsers;
  });

  const [currentUser, setCurrentUserState] = useState<User>(() => {
    const savedUser = localStorage.getItem('sas_current_user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        if (parsed && parsed.id) return parsed;
      } catch (e) {}
    }
    const savedUserId = localStorage.getItem('sas_current_user_id');
    if (savedUserId) {
      const found = initialUsers.find((u: User) => u.id === savedUserId);
      if (found) return found;
    }
    return initialUsers[0];
  });
  const [activeTab, setActiveTab] = useState<string>(() => {
    const savedTab = localStorage.getItem('sas_active_tab');
    return savedTab || 'overview';
  });

  const [companies, setCompanies] = useState<Company[]>(() => {
    const saved = localStorage.getItem('sas_companies');
    return saved ? JSON.parse(saved) : initialCompanies;
  });

  const [flights, setFlights] = useState<Flight[]>(() => {
    const saved = localStorage.getItem('sas_flights');
    return saved ? JSON.parse(saved) : initialFlights;
  });

  const [selectedFlightId, setSelectedFlightId] = useState<string>(() => flights[0]?.id || 'FLT-001');

  const [baggage, setBaggage] = useState<Baggage[]>(() => {
    const saved = localStorage.getItem('sas_baggage');
    return saved ? JSON.parse(saved) : generateInitialBags();
  });

  const [dollies, setDollies] = useState<Dolly[]>(() => {
    const saved = localStorage.getItem('sas_dollies');
    return saved ? JSON.parse(saved) : initialDollies;
  });

  const [tasks, setTasks] = useState<FlightTaskItem[]>(() => {
    const saved = localStorage.getItem('sas_tasks');
    return saved ? JSON.parse(saved) : initialFlightTasks;
  });

  const [turnaroundMilestones, setTurnaroundMilestones] = useState<TurnaroundMilestone[]>(() => {
    const saved = localStorage.getItem('sas_milestones');
    return saved ? JSON.parse(saved) : generateInitialMilestones();
  });

  const [agentSessions, setAgentSessions] = useState<AgentSession[]>(() => {
    const saved = localStorage.getItem('sas_agent_sessions');
    return saved ? JSON.parse(saved) : initialAgentSessions;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem('sas_audit');
    return saved ? JSON.parse(saved) : initialAuditLogs;
  });

  const [sessionLogs] = useState<UserSessionLog[]>(initialSessionLogs);

  // Load dynamic data from Laravel Backend API
  useEffect(() => {
    let isMounted = true;
    const fetchBackendData = async () => {
      try {
        const [uRes, cRes, fRes, bRes, dRes, tRes, mRes, aRes, sRes] = await Promise.allSettled([
          api.users.getAll(),
          api.companies.getAll(),
          api.flights.getAll(),
          api.baggages.getAll(),
          api.dollies.getAll(),
          api.tasks.getAll(),
          api.milestones.getAll(),
          api.auditLogs.getAll(),
          api.sessions.getAll(),
        ]);

        if (isMounted) {
          if (uRes.status === 'fulfilled' && Array.isArray(uRes.value.data) && uRes.value.data.length > 0) {
            setUsers(uRes.value.data);
            const savedUserId = localStorage.getItem('sas_current_user_id');
            setCurrentUserState(prev => {
              const targetId = savedUserId || prev?.id;
              const matched = uRes.value.data.find((u: User) => u.id === targetId);
              if (matched) {
                localStorage.setItem('sas_current_user', JSON.stringify(matched));
                localStorage.setItem('sas_current_user_id', matched.id);
                return matched;
              }
              return prev || uRes.value.data[0];
            });
          }
          if (cRes.status === 'fulfilled' && Array.isArray(cRes.value.data) && cRes.value.data.length > 0) {
            setCompanies(cRes.value.data);
          }
          if (fRes.status === 'fulfilled' && Array.isArray(fRes.value.data) && fRes.value.data.length > 0) {
            setFlights(fRes.value.data);
            setSelectedFlightId(prev => fRes.value.data.some(f => f.id === prev) ? prev : fRes.value.data[0].id);
          }
          if (bRes.status === 'fulfilled' && Array.isArray(bRes.value.data) && bRes.value.data.length > 0) {
            setBaggage(bRes.value.data);
          }
          if (dRes.status === 'fulfilled' && Array.isArray(dRes.value.data) && dRes.value.data.length > 0) {
            setDollies(dRes.value.data);
          }
          if (tRes.status === 'fulfilled' && Array.isArray(tRes.value.data) && tRes.value.data.length > 0) {
            setTasks(tRes.value.data);
          }
          if (mRes.status === 'fulfilled' && Array.isArray(mRes.value.data) && mRes.value.data.length > 0) {
            setTurnaroundMilestones(mRes.value.data);
          }
          if (aRes.status === 'fulfilled' && Array.isArray(aRes.value.data) && aRes.value.data.length > 0) {
            setAuditLogs(aRes.value.data);
          }
        }
      } catch (e) {
        console.warn('Backend dynamic sync notice:', e);
      }
    };

    fetchBackendData();
    return () => { isMounted = false; };
  }, []);

  // Sync to local storage for offline resilience
  useEffect(() => {
    localStorage.setItem('sas_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('sas_companies', JSON.stringify(companies));
  }, [companies]);

  useEffect(() => {
    localStorage.setItem('sas_flights', JSON.stringify(flights));
  }, [flights]);

  useEffect(() => {
    localStorage.setItem('sas_baggage', JSON.stringify(baggage));
  }, [baggage]);

  useEffect(() => {
    localStorage.setItem('sas_dollies', JSON.stringify(dollies));
  }, [dollies]);

  useEffect(() => {
    localStorage.setItem('sas_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('sas_milestones', JSON.stringify(turnaroundMilestones));
  }, [turnaroundMilestones]);

  useEffect(() => {
    localStorage.setItem('sas_agent_sessions', JSON.stringify(agentSessions));
  }, [agentSessions]);

  useEffect(() => {
    localStorage.setItem('sas_audit', JSON.stringify(auditLogs));
  }, [auditLogs]);

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('sas_is_authenticated') === 'true';
  });

  const userRole = currentUser?.role || 'Administrator';
  const basePermissions = ROLE_PERMISSIONS[userRole] || ROLE_PERMISSIONS['Administrator'];
  const permissions: UserPermission = currentUser?.customPermissions
    ? { ...basePermissions, ...currentUser.customPermissions }
    : basePermissions;

  const login = async (identifier: string, password?: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const res = await api.auth.login(identifier, password);
      if (res.data?.success && res.data.user) {
        const u = res.data.user;
        setCurrentUserState(u);
        setIsAuthenticated(true);
        localStorage.setItem('sas_is_authenticated', 'true');
        localStorage.setItem('sas_current_user_id', u.id);
        localStorage.setItem('sas_current_user', JSON.stringify(u));
        if (res.data.token) {
          localStorage.setItem('sas_auth_token', res.data.token);
        }
        if (u.role === 'Ramp/Loading Agent') {
          setActiveTab('ramp_field');
          localStorage.setItem('sas_active_tab', 'ramp_field');
        } else if (u.role === 'Sorting Agent') {
          setActiveTab('baggage');
          localStorage.setItem('sas_active_tab', 'baggage');
        } else {
          setActiveTab('dashboard');
          localStorage.setItem('sas_active_tab', 'dashboard');
        }
        return { success: true };
      }
    } catch (err: any) {
      if (!password) {
        return { success: false, message: 'Password is required to authenticate.' };
      }
      if (password !== 'admin123') {
        return { success: false, message: 'Incorrect password. Default password is: admin123' };
      }
      // Local fallback lookup
      const clean = identifier.trim().toLowerCase();
      const matched = users.find(u =>
        u.email.toLowerCase() === clean ||
        u.badgeId.toLowerCase() === clean ||
        u.id.toLowerCase() === clean
      );
      if (matched) {
        setCurrentUserState(matched);
        setIsAuthenticated(true);
        localStorage.setItem('sas_is_authenticated', 'true');
        localStorage.setItem('sas_current_user_id', matched.id);
        localStorage.setItem('sas_current_user', JSON.stringify(matched));
        if (matched.role === 'Ramp/Loading Agent') {
          setActiveTab('ramp_field');
          localStorage.setItem('sas_active_tab', 'ramp_field');
        } else if (matched.role === 'Sorting Agent') {
          setActiveTab('baggage');
          localStorage.setItem('sas_active_tab', 'baggage');
        } else {
          setActiveTab('dashboard');
          localStorage.setItem('sas_active_tab', 'dashboard');
        }
        return { success: true };
      }
      return { success: false, message: 'Invalid credentials. User not found.' };
    }
    return { success: false, message: 'Authentication failed.' };
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('sas_is_authenticated');
    localStorage.removeItem('sas_auth_token');
    localStorage.removeItem('sas_current_user');
    localStorage.removeItem('sas_current_user_id');
    localStorage.removeItem('sas_active_tab');
    if (currentUser) {
      api.auth.logout(currentUser.id).catch(() => {});
      logActivity('Security', 'AUTH_LOGOUT', currentUser.badgeId, `User logged out: ${currentUser.name}`, 'info');
    }
  };

  const updateUserPermissions = (userId: string, customPermissions: Partial<UserPermission>) => {
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        const updated = { ...u, customPermissions };
        if (currentUser.id === userId) {
          setCurrentUserState(updated);
          localStorage.setItem('sas_current_user', JSON.stringify(updated));
        }
        api.users.update(userId, { customPermissions }).catch(() => {});
        logActivity('Security', 'UPDATE', u.badgeId, `Administrator modified permissions for ${u.name} (${u.role})`, 'warning');
        return updated;
      }
      return u;
    }));
  };

  const selectedFlight = flights.find(f => f.id === selectedFlightId) || flights[0];

  const logActivity = (
    module: AuditLog['module'],
    actionType: AuditLog['actionType'],
    entityId: string,
    details: string,
    severity: AuditLog['severity'] = 'info',
    previousState?: string,
    newState?: string
  ) => {
    const now = new Date();
    const timestamp = `${now.toISOString().slice(0, 10)} ${now.toTimeString().slice(0, 8)}`;
    
    let deviceName = 'Desktop Workstation #01';
    if (currentUser.role === 'Sorting Agent') deviceName = 'Zebra MC3300 Handheld #S02';
    if (currentUser.role === 'Ramp/Loading Agent') deviceName = 'Zebra TC57 Handheld #R04';
    if (currentUser.role === 'Subplane Agent') deviceName = 'Zebra TC77 Apron Terminal #P01';

    const newLog: AuditLog = {
      id: `AUD-${Date.now().toString().slice(-6)}`,
      timestamp,
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      module,
      actionType,
      entityId,
      details,
      previousState,
      newState,
      severity,
      device: deviceName
    };

    setAuditLogs(prev => [newLog, ...prev]);
    api.auditLogs.create(newLog).catch(() => {});
  };

  const setCurrentUser = (user: User) => {
    setCurrentUserState(user);
    localStorage.setItem('sas_current_user_id', user.id);
    localStorage.setItem('sas_current_user', JSON.stringify(user));
    logActivity('Security', 'AUTH_LOGIN', user.badgeId, `User switched session to ${user.name} (${user.role})`, 'info');
    api.auth.switchUser(user.id).catch(() => {});
  };

  // Flight CRUD
  const addFlight = (flightData: Omit<Flight, 'id' | 'bagsSortedCount' | 'bagsLoadedCount' | 'comments' | 'dollyIds' | 'isLocked'>): Flight => {
    const newId = `FLT-${Date.now().toString().slice(-4)}`;
    const newFlight: Flight = {
      ...flightData,
      id: newId,
      isLocked: false,
      bagsSortedCount: 0,
      bagsLoadedCount: 0,
      comments: [],
      dollyIds: []
    };

    setFlights(prev => [newFlight, ...prev]);
    setSelectedFlightId(newId);

    logActivity('Flight', 'CREATE', newFlight.flightNbr, `New flight ${newFlight.flightNbr} registered for ${newFlight.companyName} at Gate ${newFlight.gateNbr}`, 'info');
    api.flights.create(newFlight).catch(() => {});
    return newFlight;
  };

  const updateFlight = (id: string, updates: Partial<Flight>) => {
    setFlights(prev => prev.map(f => {
      if (f.id === id) {
        const updated = { ...f, ...updates };
        logActivity('Flight', 'UPDATE', f.flightNbr, `Flight ${f.flightNbr} details updated`, 'info');
        return updated;
      }
      return f;
    }));
    api.flights.update(id, updates).catch(() => {});
  };

  const lockFlight = (id: string) => {
    setFlights(prev => prev.map(f => {
      if (f.id === id) {
        logActivity('Flight', 'LOCK', f.flightNbr, `Flight ${f.flightNbr} locked against further edits post-departure`, 'success', f.status, 'Locked');
        return { ...f, isLocked: true, status: 'Locked' };
      }
      return f;
    }));
    api.flights.lock(id, true).catch(() => {});
  };

  const unlockFlight = (id: string) => {
    setFlights(prev => prev.map(f => {
      if (f.id === id) {
        logActivity('Flight', 'UNLOCK', f.flightNbr, `Flight ${f.flightNbr} unlocked for operational edits`, 'warning', 'Locked', 'Scheduled');
        return { ...f, isLocked: false, status: 'Scheduled' };
      }
      return f;
    }));
    api.flights.lock(id, false).catch(() => {});
  };

  const cancelFlight = (id: string, reason: string = 'Operational cancellation') => {
    setFlights(prev => prev.map(f => {
      if (f.id === id) {
        logActivity('Flight', 'UPDATE', f.flightNbr, `Flight ${f.flightNbr} CANCELLED. Reason: ${reason}`, 'critical', f.status, 'Cancelled');
        return { ...f, status: 'Cancelled' as const };
      }
      return f;
    }));
    api.flights.update(id, { status: 'Cancelled' }).catch(() => {});
  };

  const deleteFlight = (id: string) => {
    const flight = flights.find(f => f.id === id);
    if (flight) {
      logActivity('Flight', 'DELETE', flight.flightNbr, `Flight ${flight.flightNbr} deleted from schedule`, 'warning');
      setFlights(prev => prev.filter(f => f.id !== id));
      if (selectedFlightId === id) {
        const remaining = flights.filter(f => f.id !== id);
        if (remaining.length > 0) setSelectedFlightId(remaining[0].id);
      }
      api.flights.delete(id).catch(() => {});
    }
  };

  const addFlightComment = (flightId: string, message: string, category: 'general' | 'discrepancy' | 'security' | 'loading' | 'delay') => {
    const now = new Date();
    const timestamp = `${now.toISOString().slice(0, 10)} ${now.toTimeString().slice(0, 5)}`;
    
    const newComment = {
      id: `C-${Date.now().toString().slice(-4)}`,
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorRole: currentUser.role,
      timestamp,
      message,
      category
    };

    setFlights(prev => prev.map(f => {
      if (f.id === flightId) {
        return { ...f, comments: [...f.comments, newComment] };
      }
      return f;
    }));

    const flight = flights.find(f => f.id === flightId);
    logActivity('Flight', 'COMMENT_ADD', flight?.flightNbr || flightId, `Comment added [${category}]: "${message.slice(0, 60)}..."`, category === 'discrepancy' ? 'warning' : 'info');
    api.flights.addComment(flightId, newComment).catch(() => {});
  };

  // Step 1: Check-in / Sorting Area Scan
  const scanBagStep1 = (tagNumber: string, flightNbr: string, sortingZone: string, dollyId?: string): { success: boolean; message: string; bag?: Baggage } => {
    const cleanTag = tagNumber.trim();
    if (!cleanTag) return { success: false, message: 'Tag number is required' };

    const now = new Date();
    const timestamp = `${now.toISOString().slice(0, 10)} ${now.toTimeString().slice(0, 8)}`;

    const existingBag = baggage.find(b => b.tagNumber === cleanTag);

    if (existingBag) {
      if (existingBag.flightNbr !== flightNbr) {
        soundManager.playErrorBuzzer();
        logActivity('Baggage', 'RECONCILE_ALERT', cleanTag, `Wrong flight scan! Bag ${cleanTag} belongs to ${existingBag.flightNbr}, attempted to sort into ${flightNbr}`, 'critical');
        return {
          success: false,
          message: `CRITICAL: Bag ${cleanTag} belongs to flight ${existingBag.flightNbr}, NOT ${flightNbr}!`,
          bag: existingBag
        };
      }

      // Update existing bag
      const updatedBag: Baggage = {
        ...existingBag,
        status: existingBag.status === 'LOADED' ? 'LOADED' : 'SORTED',
        sortingZone,
        sortingUser: currentUser.name,
        sortingTimestamp: timestamp,
        dollyId: dollyId || existingBag.dollyId
      };

      setBaggage(prev => prev.map(b => b.id === updatedBag.id ? updatedBag : b));
      soundManager.playSuccessBeep();

      // Update user count
      setUsers(prev => prev.map(u => u.id === currentUser.id ? { ...u, bagsScannedToday: u.bagsScannedToday + 1 } : u));

      // Recalculate flight stats
      setFlights(prev => prev.map(f => {
        if (f.flightNbr === flightNbr) {
          const sortedCount = f.bagsSortedCount + (existingBag.status === 'CHECKED_IN' ? 1 : 0);
          return { ...f, bagsSortedCount: sortedCount, status: f.status === 'Scheduled' ? 'Sorting' : f.status };
        }
        return f;
      }));

      logActivity('Baggage', 'SCAN_STEP1', cleanTag, `Step 1: Bag ${cleanTag} verified at ${sortingZone}${dollyId ? ` (Dolly ${dollyId})` : ''}`, 'info', existingBag.status, updatedBag.status);
      api.baggages.scanSorting({ tagNumber: cleanTag, zone: sortingZone, userName: currentUser.name, userId: currentUser.id, dollyId }).catch(() => {});
      return { success: true, message: `Tag ${cleanTag} scanned & sorted successfully`, bag: updatedBag };
    } else {
      // New tag discovered during sorting
      const newBag: Baggage = {
        id: `BAG-${Date.now().toString().slice(-6)}`,
        tagNumber: cleanTag,
        flightNbr,
        passengerName: `Passenger (Tag ${cleanTag.slice(-4)})`,
        seatNumber: '12B',
        destination: 'Destination Airport',
        classType: 'Economy',
        weightKg: 20,
        status: 'SORTED',
        sortingZone,
        sortingUser: currentUser.name,
        sortingTimestamp: timestamp,
        dollyId,
        holdLocation: 'Unassigned',
        isRush: false,
        isHeavy: false,
        isFragile: false,
        comments: []
      };

      setBaggage(prev => [newBag, ...prev]);
      soundManager.playSuccessBeep();

      setUsers(prev => prev.map(u => u.id === currentUser.id ? { ...u, bagsScannedToday: u.bagsScannedToday + 1 } : u));

      setFlights(prev => prev.map(f => {
        if (f.flightNbr === flightNbr) {
          return { ...f, bagsSortedCount: f.bagsSortedCount + 1, totalBagsExpected: Math.max(f.totalBagsExpected, f.bagsSortedCount + 1) };
        }
        return f;
      }));

      logActivity('Baggage', 'SCAN_STEP1', cleanTag, `Step 1: New Tag ${cleanTag} registered & sorted for Flight ${flightNbr}`, 'info', 'UNREGISTERED', 'SORTED');
      api.baggages.create(newBag).catch(() => {});
      return { success: true, message: `New tag ${cleanTag} created and sorted into ${flightNbr}`, bag: newBag };
    }
  };

  // Step 2: Aircraft Loading Verification Scan
  const scanBagStep2 = (tagNumber: string, flightNbr: string, holdLocation: HoldPosition): { success: boolean; message: string; bag?: Baggage; isWrongFlight?: boolean; isDiscrepancy?: boolean } => {
    const cleanTag = tagNumber.trim();
    if (!cleanTag) return { success: false, message: 'Tag number is required' };

    const now = new Date();
    const timestamp = `${now.toISOString().slice(0, 10)} ${now.toTimeString().slice(0, 8)}`;

    const existingBag = baggage.find(b => b.tagNumber === cleanTag);

    if (!existingBag) {
      soundManager.playErrorBuzzer();
      logActivity('Baggage', 'RECONCILE_ALERT', cleanTag, `Unknown tag ${cleanTag} scanned at aircraft hold door! Tag not present in check-in manifest`, 'critical');
      return {
        success: false,
        message: `CRITICAL ALERT: Tag ${cleanTag} not found in check-in database! Potential security discrepancy!`,
        isDiscrepancy: true
      };
    }

    if (existingBag.flightNbr !== flightNbr) {
      soundManager.playErrorBuzzer();
      logActivity('Baggage', 'RECONCILE_ALERT', cleanTag, `WRONG FLIGHT ATTEMPTED TO LOAD! Tag ${cleanTag} belongs to ${existingBag.flightNbr}, attempted to load into ${flightNbr}`, 'critical');
      return {
        success: false,
        message: `CRITICAL ERROR: Tag ${cleanTag} belongs to flight ${existingBag.flightNbr}, NOT ${flightNbr}! DO NOT LOAD!`,
        bag: existingBag,
        isWrongFlight: true
      };
    }

    if (existingBag.status === 'LOADED') {
      soundManager.playSuccessBeep();
      return {
        success: true,
        message: `Tag ${cleanTag} was already scanned and loaded into ${existingBag.holdLocation}`,
        bag: existingBag
      };
    }

    // Mark as LOADED
    const updatedBag: Baggage = {
      ...existingBag,
      status: 'LOADED',
      loadingZone: `Stand Hold Door (${holdLocation})`,
      loadingUser: currentUser.name,
      loadingTimestamp: timestamp,
      holdLocation,
      alerts: []
    };

    setBaggage(prev => prev.map(b => b.id === updatedBag.id ? updatedBag : b));
    soundManager.playLoadVerifiedBeep();

    setUsers(prev => prev.map(u => u.id === currentUser.id ? { ...u, bagsScannedToday: u.bagsScannedToday + 1 } : u));

    // Update flight stats
    setFlights(prev => prev.map(f => {
      if (f.flightNbr === flightNbr) {
        const loadedCount = f.bagsLoadedCount + 1;
        const isReconciled = loadedCount >= f.totalBagsExpected && loadedCount > 0;
        return {
          ...f,
          bagsLoadedCount: loadedCount,
          status: isReconciled ? 'Reconciled' : 'Loading'
        };
      }
      return f;
    }));

    logActivity('Baggage', 'SCAN_STEP2', cleanTag, `Step 2 Verified: Bag ${cleanTag} (${existingBag.passengerName}) loaded into ${holdLocation}`, 'success', existingBag.status, 'LOADED');
    api.baggages.scanLoading({ tagNumber: cleanTag, zone: `Stand Hold Door (${holdLocation})`, userName: currentUser.name, userId: currentUser.id, holdLocation }).catch(() => {});
    return { success: true, message: `Tag ${cleanTag} verified & stowed in ${holdLocation}`, bag: updatedBag };
  };

  const addBagComment = (bagId: string, text: string, isDiscrepancy: boolean) => {
    const now = new Date();
    const timestamp = `${now.toISOString().slice(0, 10)} ${now.toTimeString().slice(0, 5)}`;
    
    const newComment = {
      id: `BC-${Date.now().toString().slice(-4)}`,
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorRole: currentUser.role,
      timestamp,
      text,
      isDiscrepancy
    };

    setBaggage(prev => prev.map(b => {
      if (b.id === bagId) {
        const updated = {
          ...b,
          comments: [...b.comments, newComment],
          status: isDiscrepancy ? ('DISCREPANCY' as const) : b.status
        };
        logActivity('Baggage', 'COMMENT_ADD', b.tagNumber, `Operator comment added: "${text}"`, isDiscrepancy ? 'warning' : 'info');
        api.baggages.update(b.id, updated).catch(() => {});
        return updated;
      }
      return b;
    }));
  };

  const resolveBagDiscrepancy = (bagId: string) => {
    setBaggage(prev => prev.map(b => {
      if (b.id === bagId) {
        logActivity('Baggage', 'UPDATE', b.tagNumber, `Discrepancy resolved for bag ${b.tagNumber}`, 'success', b.status, 'SORTED');
        api.baggages.update(b.id, { status: 'SORTED', alerts: [] }).catch(() => {});
        return { ...b, status: 'SORTED', alerts: [] };
      }
      return b;
    }));
  };

  const markBagOffloaded = (bagId: string, reason: string) => {
    setBaggage(prev => prev.map(b => {
      if (b.id === bagId) {
        logActivity('Baggage', 'UPDATE', b.tagNumber, `Bag marked OFFLOADED (${reason})`, 'warning', b.status, 'OFFLOADED');
        const updated = {
          ...b,
          status: 'OFFLOADED' as const,
          holdLocation: 'Unassigned' as const,
          comments: [
            ...b.comments,
            {
              id: `BC-OFF-${Date.now()}`,
              authorId: currentUser.id,
              authorName: currentUser.name,
              authorRole: currentUser.role,
              timestamp: new Date().toISOString().slice(0, 16).replace('T', ' '),
              text: `Offloaded from flight: ${reason}`,
              isDiscrepancy: true
            }
          ]
        };
        api.baggages.update(b.id, updated).catch(() => {});
        return updated;
      }
      return b;
    }));
  };

  // Simulate Rapid Batch Scan for testing
  const simulateBatchScan = (flightNbr: string, step: 1 | 2, count: number = 3) => {
    const flightBags = baggage.filter(b => b.flightNbr === flightNbr);
    let targetBags: Baggage[] = [];

    if (step === 1) {
      targetBags = flightBags.filter(b => b.status === 'CHECKED_IN' || b.status === 'MISSING').slice(0, count);
    } else {
      targetBags = flightBags.filter(b => b.status === 'SORTED').slice(0, count);
    }

    if (targetBags.length === 0) {
      targetBags = flightBags.slice(0, count);
    }

    targetBags.forEach((b, idx) => {
      setTimeout(() => {
        if (step === 1) {
          scanBagStep1(b.tagNumber, flightNbr, 'Sorter Carousel 02', 'DLY-101');
        } else {
          const hold = idx % 2 === 0 ? 'Hold 1 Fwd' : 'Hold 2 Aft';
          scanBagStep2(b.tagNumber, flightNbr, hold);
        }
      }, idx * 300);
    });
  };

  // Company CRUD
  const addCompany = (compData: Omit<Company, 'id' | 'activeFlightsCount' | 'slaComplianceRate'>) => {
    const newComp: Company = {
      ...compData,
      id: `CMP-${Date.now().toString().slice(-4)}`,
      activeFlightsCount: 0,
      slaComplianceRate: 100.0
    };
    setCompanies(prev => [...prev, newComp]);
    logActivity('Company', 'CREATE', newComp.name, `New airline partner ${newComp.name} (${newComp.abbreviation}) added`, 'info');
    api.companies.create(newComp).catch(() => {});
  };

  const updateCompany = (id: string, updates: Partial<Company>) => {
    setCompanies(prev => prev.map(c => {
      if (c.id === id) {
        logActivity('Company', 'UPDATE', c.name, `Company details updated for ${c.name}`, 'info');
        return { ...c, ...updates };
      }
      return c;
    }));
    api.companies.update(id, updates).catch(() => {});
  };

  const deleteCompany = (id: string) => {
    const comp = companies.find(c => c.id === id);
    if (comp) {
      logActivity('Company', 'DELETE', comp.name, `Company ${comp.name} removed from registry`, 'warning');
      setCompanies(prev => prev.filter(c => c.id !== id));
      api.companies.delete(id).catch(() => {});
    }
  };

  // Dolly CRUD
  const addDolly = (dollyData: Omit<Dolly, 'id' | 'currentBagsCount' | 'lastUpdated' | 'bags'>) => {
    const newId = `DLY-${(dollies.length + 101)}`;
    const newDolly: Dolly = {
      ...dollyData,
      id: newId,
      currentBagsCount: 0,
      lastUpdated: new Date().toISOString().slice(0, 16).replace('T', ' '),
      bags: []
    };
    setDollies(prev => [...prev, newDolly]);
    logActivity('Dolly', 'CREATE', newId, `New Dolly ${newId} (${newDolly.type}) registered in zone ${newDolly.zone}`, 'info');
    api.dollies.create(newDolly).catch(() => {});
  };

  const updateDolly = (id: string, updates: Partial<Dolly>) => {
    setDollies(prev => prev.map(d => {
      if (d.id === id) {
        logActivity('Dolly', 'UPDATE', d.id, `Dolly ${d.id} updated`, 'info');
        return { ...d, ...updates, lastUpdated: new Date().toISOString().slice(0, 16).replace('T', ' ') };
      }
      return d;
    }));
    api.dollies.update(id, updates).catch(() => {});
  };

  const assignDollyFlight = (dollyId: string, flightNbr?: string) => {
    setDollies(prev => prev.map(d => {
      if (d.id === dollyId) {
        logActivity('Dolly', 'DOLLY_ASSIGN', dollyId, flightNbr ? `Dolly ${dollyId} assigned to flight ${flightNbr}` : `Dolly ${dollyId} detached from flight`, 'info');
        return { ...d, assignedFlightNbr: flightNbr, status: flightNbr ? 'Loading' : 'Available', lastUpdated: new Date().toISOString().slice(0, 16).replace('T', ' ') };
      }
      return d;
    }));
    api.dollies.update(dollyId, { assignedFlightNbr: flightNbr, status: flightNbr ? 'Loading' : 'Available' }).catch(() => {});
  };

  const deleteDolly = (id: string) => {
    const dolly = dollies.find(d => d.id === id);
    if (dolly) {
      logActivity('Dolly', 'DELETE', dolly.id, `Dolly ${dolly.id} removed from fleet`, 'warning');
      setDollies(prev => prev.filter(d => d.id !== id));
      api.dollies.delete(id).catch(() => {});
    }
  };

  // User CRUD
  const addUser = (userData: Omit<User, 'id' | 'bagsScannedToday' | 'flightsHandled'>) => {
    const newUser: User = {
      ...userData,
      id: `USR-${(users.length + 1).toString().padStart(3, '0')}`,
      bagsScannedToday: 0,
      flightsHandled: 0
    };
    setUsers(prev => [...prev, newUser]);
    logActivity('Users', 'CREATE', newUser.badgeId, `New user ${newUser.name} created with role ${newUser.role}`, 'info');
    api.users.create(newUser).catch(() => {});
  };

  const updateUser = (id: string, updates: Partial<User>) => {
    setUsers(prev => prev.map(u => {
      if (u.id === id) {
        logActivity('Users', 'UPDATE', u.badgeId, `User profile updated for ${u.name}`, 'info');
        return { ...u, ...updates };
      }
      return u;
    }));
    api.users.update(id, updates).catch(() => {});
  };

  const deleteUser = (id: string) => {
    const user = users.find(u => u.id === id);
    if (user) {
      logActivity('Users', 'DELETE', user.badgeId, `User account ${user.name} (${user.badgeId}) deleted`, 'warning');
      setUsers(prev => prev.filter(u => u.id !== id));
      api.users.delete(id).catch(() => {});
    }
  };

  // Tasks
  const addTask = (newTaskData: Omit<FlightTaskItem, 'id' | 'completedAt'>) => {
    const newTask: FlightTaskItem = {
      ...newTaskData,
      id: `TSK-${Date.now().toString().slice(-4)}`
    };
    setTasks(prev => [newTask, ...prev]);
    logActivity('Tasks', 'CREATE', newTask.flightNbr, `New task created: "${newTask.taskTitle}" for Flight ${newTask.flightNbr}`, 'info');
    api.tasks.create(newTask).catch(() => {});
  };

  const updateTaskStatus = (taskId: string, status: FlightTaskItem['status']) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        const completedAt = status === 'Completed' ? new Date().toISOString().slice(0, 16).replace('T', ' ') : t.completedAt;
        logActivity('Tasks', 'UPDATE', t.flightNbr, `Task "${t.taskTitle}" status changed to ${status}`, status === 'Completed' ? 'success' : 'info');
        return { ...t, status, completedAt };
      }
      return t;
    }));
    api.tasks.update(taskId, { status }).catch(() => {});
  };

  const toggleTaskChecklist = (taskId: string, checklistId: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        const updatedChecklist = t.checklist.map(c => c.id === checklistId ? { ...c, done: !c.done } : c);
        const allDone = updatedChecklist.every(c => c.done);
        return {
          ...t,
          checklist: updatedChecklist,
          status: allDone ? 'Completed' : 'In Progress',
          completedAt: allDone ? new Date().toISOString().slice(0, 16).replace('T', ' ') : t.completedAt
        };
      }
      return t;
    }));
    api.tasks.toggleItem(taskId, checklistId).catch(() => {});
  };

  // Turnaround Milestone Actions
  const updateMilestoneStatus = (milestoneId: string, status: MilestoneStatus, customNotes?: string) => {
    const now = new Date();
    const timeStr = now.toTimeString().slice(0, 8);
    const isoStr = now.toISOString();

    // Stand GPS coordinates based on standard Carthage Airport TUN Stand 14
    const baseLat = 36.85124;
    const baseLng = 10.22742;
    const jitter = (Math.random() - 0.5) * 0.0003;
    const recordedLat = parseFloat((baseLat + jitter).toFixed(6));
    const recordedLng = parseFloat((baseLng + jitter).toFixed(6));

    setTurnaroundMilestones(prev => prev.map(m => {
      if (m.id === milestoneId) {
        const isCompleted = status === 'COMPLETED';
        const updated: TurnaroundMilestone = {
          ...m,
          status,
          actualTime: isCompleted ? (m.actualTime || timeStr) : (status === 'PENDING' ? undefined : m.actualTime),
          timestampExact: isCompleted ? (m.timestampExact || isoStr) : (status === 'PENDING' ? undefined : m.timestampExact),
          completedByUserId: isCompleted ? currentUser.id : m.completedByUserId,
          completedByUserName: isCompleted ? currentUser.name : m.completedByUserName,
          completedByUserRole: isCompleted ? currentUser.role : m.completedByUserRole,
          gpsLatitude: isCompleted ? (m.gpsLatitude || recordedLat) : m.gpsLatitude,
          gpsLongitude: isCompleted ? (m.gpsLongitude || recordedLng) : m.gpsLongitude,
          gpsAccuracyMeters: isCompleted ? (m.gpsAccuracyMeters || 1.8) : m.gpsAccuracyMeters,
          notes: customNotes !== undefined ? customNotes : m.notes
        };

        if (status === 'COMPLETED') {
          soundManager.playLoadVerifiedBeep();
          logActivity(
            'Tasks',
            'UPDATE',
            m.flightNbr,
            `Turnaround Milestone [${m.code} - ${m.title}] marked COMPLETED by ${currentUser.name} at GPS (${recordedLat}°N, ${recordedLng}°E)`,
            'success',
            m.status,
            'COMPLETED'
          );
          api.milestones.complete(milestoneId, {
            userId: currentUser.id,
            userName: currentUser.name,
            userRole: currentUser.role,
            gpsLatitude: recordedLat,
            gpsLongitude: recordedLng,
            gpsAccuracy: 1.8,
            notes: customNotes
          }).catch(() => {});
        } else {
          logActivity(
            'Tasks',
            'UPDATE',
            m.flightNbr,
            `Turnaround Milestone [${m.code}] status set to ${status}`,
            'info',
            m.status,
            status
          );
          api.milestones.update(milestoneId, { status, notes: customNotes }).catch(() => {});
        }

        return updated;
      }
      return m;
    }));
  };

  const assignMilestoneAgent = (milestoneId: string, userId: string) => {
    const matchedUser = users.find(u => u.id === userId);
    if (!matchedUser) return;

    setTurnaroundMilestones(prev => prev.map(m => {
      if (m.id === milestoneId) {
        logActivity('Tasks', 'UPDATE', m.flightNbr, `Milestone [${m.code}] assigned to ${matchedUser.name} (${matchedUser.role})`, 'info');
        return {
          ...m,
          completedByUserId: matchedUser.id,
          completedByUserName: matchedUser.name,
          completedByUserRole: matchedUser.role
        };
      }
      return m;
    }));
    api.milestones.update(milestoneId, { completedByUserId: matchedUser.id, completedByUserName: matchedUser.name, completedByUserRole: matchedUser.role }).catch(() => {});
  };

  const assignMultipleMilestonesToAgent = (flightNbr: string, milestoneCodes: string[], userId: string) => {
    const matchedUser = users.find(u => u.id === userId);
    if (!matchedUser) return;

    setTurnaroundMilestones(prev => prev.map(m => {
      if (m.flightNbr === flightNbr && milestoneCodes.includes(m.code)) {
        api.milestones.update(m.id, { completedByUserId: matchedUser.id, completedByUserName: matchedUser.name, completedByUserRole: matchedUser.role }).catch(() => {});
        return {
          ...m,
          completedByUserId: matchedUser.id,
          completedByUserName: matchedUser.name,
          completedByUserRole: matchedUser.role
        };
      }
      return m;
    }));
  };

  const dispatchFlightToRampAgent = (params: {
    userId: string;
    flightId: string;
    milestoneCodes?: string[];
    taskTitle?: string;
    priority?: TaskPriority;
    targetTime?: string;
    notes?: string;
    checklist?: { id: string; text: string; done: boolean }[];
  }) => {
    const targetUser = users.find(u => u.id === params.userId) || currentUser;
    const targetFlight = flights.find(f => f.id === params.flightId) || selectedFlight || flights[0];

    // 1. Update user assigned flight and count
    setUsers(prev => prev.map(u => {
      if (u.id === targetUser.id) {
        return {
          ...u,
          status: 'on_shift',
          assignedFlightNbr: targetFlight.flightNbr,
          assignedZone: targetFlight.subplaneAreaZone || u.assignedZone,
          assignedMilestones: params.milestoneCodes || ['HOLD_OPEN', 'BAG_LOAD_START', 'BAG_LOAD_END', 'HOLD_CLOSED'],
          flightsHandled: u.flightsHandled + 1
        };
      }
      return u;
    }));

    // 2. Update flight details
    setFlights(prev => prev.map(f => {
      if (f.id === targetFlight.id) {
        return {
          ...f,
          assignedRampAgent: targetUser.name,
          assignedRampAgentBadge: targetUser.badgeId,
          subplaneAreaUser: targetUser.role === 'Subplane Agent' ? targetUser.name : f.subplaneAreaUser
        };
      }
      return f;
    }));
    api.flights.update(targetFlight.id, {
      assignedRampAgent: targetUser.name,
      assignedRampAgentBadge: targetUser.badgeId,
    }).catch(() => {});

    // 3. Update milestones
    const milestoneCodes = params.milestoneCodes && params.milestoneCodes.length > 0
      ? params.milestoneCodes
      : targetUser.role === 'Sorting Agent'
      ? ['BAG_OFFLOAD_START', 'BAG_LOAD_START']
      : ['HOLD_OPEN', 'BAG_OFFLOAD_START', 'BAG_LOAD_START', 'BAG_LOAD_END', 'HOLD_CLOSED'];

    setTurnaroundMilestones(prev => prev.map(m => {
      if (m.flightNbr === targetFlight.flightNbr && milestoneCodes.includes(m.code)) {
        return {
          ...m,
          completedByUserId: targetUser.id,
          completedByUserName: targetUser.name,
          completedByUserRole: targetUser.role
        };
      }
      return m;
    }));

    // 4. Create structured task
    const defaultChecklist = [
      { id: 'c1', text: `Verify aircraft hold doors open & clear at ${targetFlight.subplaneAreaZone || targetFlight.gateNbr}`, done: false },
      { id: 'c2', text: `Zebra Handheld Scanner ready in Step 2 Hold Verification mode`, done: true },
      { id: 'c3', text: `Verify BINGOS Luggage Compartment distribution (Hold 1 / 2 / 3)`, done: false },
      { id: 'c4', text: `Perform 100% barcode reconciliation with Sorter Dolly feed`, done: false },
      { id: 'c5', text: `Inspect hold safety netting and secure latch locks before pushback`, done: false }
    ];

    const newTask: FlightTaskItem = {
      id: `TSK-${Date.now().toString().slice(-4)}`,
      flightNbr: targetFlight.flightNbr,
      taskTitle: params.taskTitle || `Turnaround Ramp Dispatch: ${targetFlight.flightNbr} (${targetFlight.companyName})`,
      category: targetUser.role === 'Ramp/Loading Agent' ? 'Loading' : targetUser.role === 'Subplane Agent' ? 'Subplane' : 'Sorting',
      assignedRole: targetUser.role,
      assignedUserId: targetUser.id,
      assignedUserName: targetUser.name,
      status: 'In Progress',
      priority: params.priority || 'High',
      targetTime: params.targetTime || targetFlight.std || '14:30',
      checklist: params.checklist || defaultChecklist,
      notes: params.notes || `Dispatched to Ramp Agent ${targetUser.name} (${targetUser.badgeId}) for Turnaround Flight ${targetFlight.flightNbr} at ${targetFlight.subplaneAreaZone || targetFlight.gateNbr}`
    };

    setTasks(prev => [newTask, ...prev]);

    // 5. Start/update active field session
    startAgentSession(targetFlight.id, targetUser.id);

    // 6. Sound & log
    soundManager.playLoadVerifiedBeep();
    logActivity(
      'Tasks',
      'CREATE',
      targetFlight.flightNbr,
      `DISPATCH: Flight ${targetFlight.flightNbr} (${targetFlight.companyName}) assigned to Ramp Agent ${targetUser.name} (${targetUser.role}, ${targetUser.badgeId}) with ${milestoneCodes.length} turnaround milestones`,
      'success'
    );
  };

  // Agent Session Tracking
  const startAgentSession = (flightId: string, userId?: string): AgentSession => {
    const userToAssign = userId ? (users.find(u => u.id === userId) || currentUser) : currentUser;
    const flightObj = flights.find(f => f.id === flightId) || selectedFlight || flights[0];
    const now = new Date();

    const newSession: AgentSession = {
      sessionId: `SES-${Date.now().toString().slice(-6)}`,
      flightId: flightObj.id,
      flightNbr: flightObj.flightNbr,
      agentId: userToAssign.id,
      agentName: userToAssign.name,
      agentRole: userToAssign.role,
      badgeId: userToAssign.badgeId,
      startedAt: `${now.toISOString().slice(0, 10)} ${now.toTimeString().slice(0, 5)}`,
      lastPingAt: `${now.toISOString().slice(0, 10)} ${now.toTimeString().slice(0, 8)}`,
      deviceModel: userToAssign.role === 'Ramp/Loading Agent' 
        ? 'Zebra TC57x Handheld Scanner (SN: ZEB-7890)' 
        : userToAssign.role === 'Subplane Agent' 
        ? 'Zebra TC77 Touch Computer (SN: ZEB-5512)' 
        : 'Zebra MC3300 Fixed Terminal #S02',
      batteryLevel: Math.floor(75 + Math.random() * 25),
      signalStrength: 'Strong',
      currentGps: {
        latitude: 36.85124 + (Math.random() - 0.5) * 0.0002,
        longitude: 10.22742 + (Math.random() - 0.5) * 0.0002,
        accuracy: 1.8,
        zoneName: flightObj.subplaneAreaZone || 'Stand 14 - Apron South'
      },
      isActive: true,
      assignedMilestones: ['HOLD_OPEN', 'BAG_LOAD_START', 'BAG_LOAD_END']
    };

    setAgentSessions(prev => [newSession, ...prev.filter(s => !(s.agentId === userToAssign.id && s.flightId === flightObj.id))]);
    logActivity('Security', 'AUTH_LOGIN', flightObj.flightNbr, `Active Turnaround Field Session started by ${userToAssign.name} (${userToAssign.role}) on Flight ${flightObj.flightNbr}`, 'info');
    return newSession;
  };

  const pingAgentSessionGps = (sessionId: string, lat?: number, lng?: number) => {
    const now = new Date();
    const timeStr = `${now.toISOString().slice(0, 10)} ${now.toTimeString().slice(0, 8)}`;
    const newLat = lat || (36.85124 + (Math.random() - 0.5) * 0.0001);
    const newLng = lng || (10.22742 + (Math.random() - 0.5) * 0.0001);

    setAgentSessions(prev => prev.map(s => {
      if (s.sessionId === sessionId) {
        return {
          ...s,
          lastPingAt: timeStr,
          batteryLevel: Math.max(10, s.batteryLevel - 1),
          currentGps: {
            ...s.currentGps,
            latitude: newLat,
            longitude: newLng,
            accuracy: 1.6
          }
        };
      }
      return s;
    }));
  };

  const endAgentSession = (sessionId: string) => {
    setAgentSessions(prev => prev.map(s => {
      if (s.sessionId === sessionId) {
        logActivity('Security', 'AUTH_LOGOUT', s.flightNbr, `Agent Session closed for ${s.agentName}`, 'info');
        return { ...s, isActive: false };
      }
      return s;
    }));
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        userRole,
        permissions,
        isAuthenticated,
        login,
        logout,
        updateUserPermissions,
        activeTab,
        setActiveTab,
        selectedFlightId,
        setSelectedFlightId,
        selectedFlight,
        users,
        companies,
        flights,
        baggage,
        dollies,
        tasks,
        turnaroundMilestones,
        agentSessions,
        auditLogs,
        sessionLogs,
        addFlight,
        updateFlight,
        lockFlight,
        unlockFlight,
        cancelFlight,
        deleteFlight,
        addFlightComment,
        updateMilestoneStatus,
        assignMilestoneAgent,
        assignMultipleMilestonesToAgent,
        dispatchFlightToRampAgent,
        startAgentSession,
        pingAgentSessionGps,
        endAgentSession,
        scanBagStep1,
        scanBagStep2,
        addBagComment,
        resolveBagDiscrepancy,
        markBagOffloaded,
        simulateBatchScan,
        addCompany,
        updateCompany,
        deleteCompany,
        addDolly,
        updateDolly,
        deleteDolly,
        assignDollyFlight,
        addUser,
        updateUser,
        deleteUser,
        addTask,
        updateTaskStatus,
        toggleTaskChecklist,
        logActivity
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
