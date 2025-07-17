"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedAbonnementsPlans = exports.EntrepriseService = exports.ReservationService = exports.ContractService = exports.ChargeService = exports.ClientService = exports.VehicleService = exports.FirebaseService = void 0;
var firestore_1 = require("firebase/firestore");
var storage_1 = require("firebase/storage");
var firebase_1 = require("../config/firebase");
// Collections
var COLLECTIONS = {
    VEHICLES: 'vehicles',
    CLIENTS: 'clients',
    CHARGES: 'charges',
    RESERVATIONS: 'reservations',
    CONTRACTS: 'contracts',
    ENTREPRISES: 'entreprises',
};
// Enable offline persistence
try {
    (0, firestore_1.enableIndexedDbPersistence)(firebase_1.db);
}
catch (err) {
    console.warn('Firestore persistence failed:', err);
}
// Generic CRUD operations
var FirebaseService = /** @class */ (function () {
    function FirebaseService() {
    }
    // Create
    FirebaseService.create = function (collectionName, data) {
        return __awaiter(this, void 0, void 0, function () {
            var docRef, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, (0, firestore_1.addDoc)((0, firestore_1.collection)(firebase_1.db, collectionName), __assign(__assign({}, data), { createdAt: firestore_1.Timestamp.now(), updatedAt: firestore_1.Timestamp.now() }))];
                    case 1:
                        docRef = _a.sent();
                        return [2 /*return*/, docRef.id];
                    case 2:
                        error_1 = _a.sent();
                        console.error("Error creating document in ".concat(collectionName, ":"), error_1);
                        throw new Error("Erreur lors de la cr\u00E9ation: ".concat(error_1 instanceof Error ? error_1.message : 'Erreur inconnue'));
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    // Read all
    FirebaseService.getAll = function (collectionName) {
        return __awaiter(this, void 0, void 0, function () {
            var querySnapshot, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, (0, firestore_1.getDocs)((0, firestore_1.query)((0, firestore_1.collection)(firebase_1.db, collectionName), (0, firestore_1.orderBy)('createdAt', 'desc')))];
                    case 1:
                        querySnapshot = _a.sent();
                        return [2 /*return*/, querySnapshot.docs.map(function (doc) { return (__assign({ id: doc.id }, doc.data())); })];
                    case 2:
                        error_2 = _a.sent();
                        console.error("Error getting documents from ".concat(collectionName, ":"), error_2);
                        throw new Error("Erreur lors de la r\u00E9cup\u00E9ration: ".concat(error_2 instanceof Error ? error_2.message : 'Erreur inconnue'));
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    // Read one
    FirebaseService.getById = function (collectionName, id) {
        return __awaiter(this, void 0, void 0, function () {
            var docSnap, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, (0, firestore_1.getDoc)((0, firestore_1.doc)(firebase_1.db, collectionName, id))];
                    case 1:
                        docSnap = _a.sent();
                        if (docSnap.exists()) {
                            return [2 /*return*/, __assign({ id: docSnap.id }, docSnap.data())];
                        }
                        return [2 /*return*/, null];
                    case 2:
                        error_3 = _a.sent();
                        console.error("Error getting document ".concat(id, " from ").concat(collectionName, ":"), error_3);
                        throw new Error("Erreur lors de la r\u00E9cup\u00E9ration: ".concat(error_3 instanceof Error ? error_3.message : 'Erreur inconnue'));
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    // Update
    FirebaseService.update = function (collectionName, id, data) {
        return __awaiter(this, void 0, void 0, function () {
            var sanitizedData, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        sanitizedData = this.sanitizeDataForFirestore(data);
                        return [4 /*yield*/, (0, firestore_1.updateDoc)((0, firestore_1.doc)(firebase_1.db, collectionName, id), __assign(__assign({}, sanitizedData), { updatedAt: firestore_1.Timestamp.now() }))];
                    case 1:
                        _a.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        error_4 = _a.sent();
                        console.error("Error updating document ".concat(id, " in ").concat(collectionName, ":"), error_4);
                        throw new Error("Erreur lors de la mise \u00E0 jour: ".concat(error_4 instanceof Error ? error_4.message : 'Erreur inconnue'));
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    // Sanitize data for Firestore (convert nested objects to plain objects)
    FirebaseService.sanitizeDataForFirestore = function (data) {
        var _this = this;
        if (data === null || data === undefined) {
            return data;
        }
        if (Array.isArray(data)) {
            return data.map(function (item) { return _this.sanitizeDataForFirestore(item); });
        }
        if (typeof data === 'object' && data.constructor === Object) {
            var sanitized = {};
            for (var _i = 0, _a = Object.entries(data); _i < _a.length; _i++) {
                var _b = _a[_i], key = _b[0], value = _b[1];
                sanitized[key] = this.sanitizeDataForFirestore(value);
            }
            return sanitized;
        }
        return data;
    };
    // Delete
    FirebaseService.delete = function (collectionName, id) {
        return __awaiter(this, void 0, void 0, function () {
            var error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, (0, firestore_1.deleteDoc)((0, firestore_1.doc)(firebase_1.db, collectionName, id))];
                    case 1:
                        _a.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        error_5 = _a.sent();
                        console.error("Error deleting document ".concat(id, " from ").concat(collectionName, ":"), error_5);
                        throw new Error("Erreur lors de la suppression: ".concat(error_5 instanceof Error ? error_5.message : 'Erreur inconnue'));
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    // Real-time listener
    FirebaseService.onSnapshot = function (collectionName, callback, errorCallback) {
        var q = (0, firestore_1.query)((0, firestore_1.collection)(firebase_1.db, collectionName), (0, firestore_1.orderBy)('createdAt', 'desc'));
        return (0, firestore_1.onSnapshot)(q, function (querySnapshot) {
            var data = querySnapshot.docs.map(function (doc) { return (__assign({ id: doc.id }, doc.data())); });
            callback(data);
        }, function (error) {
            console.error("Error in snapshot listener for ".concat(collectionName, ":"), error);
            if (errorCallback) {
                errorCallback(new Error("Erreur de synchronisation: ".concat(error.message)));
            }
        });
    };
    // Real-time listener filtered by userId
    FirebaseService.onSnapshotByUser = function (collectionName, userId, callback, errorCallback) {
        // If no userId, return empty array
        if (!userId) {
            callback([]);
            return function () { }; // Return empty unsubscribe function
        }
        // Create query filtered by userId
        var q = (0, firestore_1.query)((0, firestore_1.collection)(firebase_1.db, collectionName), (0, firestore_1.where)('userId', '==', userId), (0, firestore_1.orderBy)('createdAt', 'desc'));
        return (0, firestore_1.onSnapshot)(q, function (querySnapshot) {
            var data = querySnapshot.docs.map(function (doc) { return (__assign({ id: doc.id }, doc.data())); });
            callback(data);
        }, function (error) {
            console.error("Error in snapshot listener for ".concat(collectionName, ":"), error);
            if (errorCallback) {
                errorCallback(new Error("Erreur de synchronisation: ".concat(error.message)));
            }
        });
    };
    // Upload file to Firebase Storage
    FirebaseService.uploadFile = function (file, path) {
        return __awaiter(this, void 0, void 0, function () {
            var storageRef, snapshot, downloadURL, error_6;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        storageRef = (0, storage_1.ref)(firebase_1.storage, path);
                        return [4 /*yield*/, (0, storage_1.uploadBytes)(storageRef, file)];
                    case 1:
                        snapshot = _a.sent();
                        return [4 /*yield*/, (0, storage_1.getDownloadURL)(snapshot.ref)];
                    case 2:
                        downloadURL = _a.sent();
                        return [2 /*return*/, downloadURL];
                    case 3:
                        error_6 = _a.sent();
                        console.error('Error uploading file:', error_6);
                        throw new Error("Erreur lors de l'upload: ".concat(error_6 instanceof Error ? error_6.message : 'Erreur inconnue'));
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    // Delete file from Firebase Storage
    FirebaseService.deleteFile = function (path) {
        return __awaiter(this, void 0, void 0, function () {
            var storageRef, error_7;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        storageRef = (0, storage_1.ref)(firebase_1.storage, path);
                        return [4 /*yield*/, (0, storage_1.deleteObject)(storageRef)];
                    case 1:
                        _a.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        error_7 = _a.sent();
                        console.error('Error deleting file:', error_7);
                        throw new Error("Erreur lors de la suppression du fichier: ".concat(error_7 instanceof Error ? error_7.message : 'Erreur inconnue'));
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    return FirebaseService;
}());
exports.FirebaseService = FirebaseService;
// Specific service methods for each collection
var VehicleService = /** @class */ (function () {
    function VehicleService() {
    }
    VehicleService.create = function (vehicle) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, FirebaseService.create(COLLECTIONS.VEHICLES, vehicle)];
            });
        });
    };
    VehicleService.getAll = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, FirebaseService.getAll(COLLECTIONS.VEHICLES)];
            });
        });
    };
    VehicleService.getById = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, FirebaseService.getById(COLLECTIONS.VEHICLES, id)];
            });
        });
    };
    VehicleService.update = function (id, vehicle) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, FirebaseService.update(COLLECTIONS.VEHICLES, id, vehicle)];
            });
        });
    };
    VehicleService.delete = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, FirebaseService.delete(COLLECTIONS.VEHICLES, id)];
            });
        });
    };
    VehicleService.onSnapshot = function (callback, errorCallback) {
        return FirebaseService.onSnapshot(COLLECTIONS.VEHICLES, callback, errorCallback);
    };
    VehicleService.onSnapshotByUser = function (userId, callback, errorCallback) {
        return FirebaseService.onSnapshotByUser(COLLECTIONS.VEHICLES, userId, callback, errorCallback);
    };
    // Upload vehicle photo
    VehicleService.uploadPhoto = function (vehicleId, file) {
        return __awaiter(this, void 0, void 0, function () {
            var path;
            return __generator(this, function (_a) {
                path = "vehicles/".concat(vehicleId, "/photo_").concat(Date.now());
                return [2 /*return*/, FirebaseService.uploadFile(file, path)];
            });
        });
    };
    return VehicleService;
}());
exports.VehicleService = VehicleService;
var ClientService = /** @class */ (function () {
    function ClientService() {
    }
    ClientService.create = function (client) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, FirebaseService.create(COLLECTIONS.CLIENTS, client)];
            });
        });
    };
    ClientService.getAll = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, FirebaseService.getAll(COLLECTIONS.CLIENTS)];
            });
        });
    };
    ClientService.getById = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, FirebaseService.getById(COLLECTIONS.CLIENTS, id)];
            });
        });
    };
    ClientService.update = function (id, client) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, FirebaseService.update(COLLECTIONS.CLIENTS, id, client)];
            });
        });
    };
    ClientService.delete = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, FirebaseService.delete(COLLECTIONS.CLIENTS, id)];
            });
        });
    };
    ClientService.onSnapshot = function (callback, errorCallback) {
        return FirebaseService.onSnapshot(COLLECTIONS.CLIENTS, callback, errorCallback);
    };
    ClientService.onSnapshotByUser = function (userId, callback, errorCallback) {
        return FirebaseService.onSnapshotByUser(COLLECTIONS.CLIENTS, userId, callback, errorCallback);
    };
    // Upload client documents
    ClientService.uploadDocument = function (clientId, file, type) {
        return __awaiter(this, void 0, void 0, function () {
            var path;
            return __generator(this, function (_a) {
                path = "clients/".concat(clientId, "/").concat(type, "_").concat(Date.now());
                return [2 /*return*/, FirebaseService.uploadFile(file, path)];
            });
        });
    };
    return ClientService;
}());
exports.ClientService = ClientService;
var ChargeService = /** @class */ (function () {
    function ChargeService() {
    }
    ChargeService.create = function (charge) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, FirebaseService.create(COLLECTIONS.CHARGES, charge)];
            });
        });
    };
    ChargeService.getAll = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, FirebaseService.getAll(COLLECTIONS.CHARGES)];
            });
        });
    };
    ChargeService.getById = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, FirebaseService.getById(COLLECTIONS.CHARGES, id)];
            });
        });
    };
    ChargeService.update = function (id, charge) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, FirebaseService.update(COLLECTIONS.CHARGES, id, charge)];
            });
        });
    };
    ChargeService.delete = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, FirebaseService.delete(COLLECTIONS.CHARGES, id)];
            });
        });
    };
    ChargeService.onSnapshot = function (callback, errorCallback) {
        return FirebaseService.onSnapshot(COLLECTIONS.CHARGES, callback, errorCallback);
    };
    ChargeService.onSnapshotByUser = function (userId, callback, errorCallback) {
        return FirebaseService.onSnapshotByUser(COLLECTIONS.CHARGES, userId, callback, errorCallback);
    };
    return ChargeService;
}());
exports.ChargeService = ChargeService;
var ContractService = /** @class */ (function () {
    function ContractService() {
    }
    ContractService.create = function (contract) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, FirebaseService.create(COLLECTIONS.CONTRACTS, contract)];
            });
        });
    };
    ContractService.getByReservationId = function (reservationId) {
        return __awaiter(this, void 0, void 0, function () {
            var q, querySnapshot, doc_1, error_8;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        q = (0, firestore_1.query)((0, firestore_1.collection)(firebase_1.db, COLLECTIONS.CONTRACTS), (0, firestore_1.where)('reservationId', '==', reservationId), (0, firestore_1.orderBy)('createdAt', 'desc'), (0, firestore_1.limit)(1));
                        return [4 /*yield*/, (0, firestore_1.getDocs)(q)];
                    case 1:
                        querySnapshot = _a.sent();
                        if (querySnapshot.empty) {
                            return [2 /*return*/, null];
                        }
                        doc_1 = querySnapshot.docs[0];
                        return [2 /*return*/, __assign({ id: doc_1.id }, doc_1.data())];
                    case 2:
                        error_8 = _a.sent();
                        console.error('Error getting contract by reservation ID:', error_8);
                        throw new Error("Erreur lors de la r\u00E9cup\u00E9ration du contrat: ".concat(error_8 instanceof Error ? error_8.message : 'Erreur inconnue'));
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    ContractService.update = function (id, contract) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, FirebaseService.update(COLLECTIONS.CONTRACTS, id, contract)];
            });
        });
    };
    ContractService.delete = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, FirebaseService.delete(COLLECTIONS.CONTRACTS, id)];
            });
        });
    };
    ContractService.onSnapshot = function (callback, errorCallback) {
        return FirebaseService.onSnapshot(COLLECTIONS.CONTRACTS, callback, errorCallback);
    };
    // Upload contract PDF
    ContractService.uploadContract = function (reservationId, file) {
        return __awaiter(this, void 0, void 0, function () {
            var path;
            return __generator(this, function (_a) {
                path = "contracts/".concat(reservationId, "/contract_").concat(Date.now(), ".pdf");
                return [2 /*return*/, FirebaseService.uploadFile(file, path)];
            });
        });
    };
    return ContractService;
}());
exports.ContractService = ContractService;
var ReservationService = /** @class */ (function () {
    function ReservationService() {
    }
    ReservationService.create = function (reservation) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, FirebaseService.create(COLLECTIONS.RESERVATIONS, reservation)];
            });
        });
    };
    ReservationService.getAll = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, FirebaseService.getAll(COLLECTIONS.RESERVATIONS)];
            });
        });
    };
    ReservationService.getById = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, FirebaseService.getById(COLLECTIONS.RESERVATIONS, id)];
            });
        });
    };
    ReservationService.update = function (id, reservation) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, FirebaseService.update(COLLECTIONS.RESERVATIONS, id, reservation)];
            });
        });
    };
    ReservationService.delete = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, FirebaseService.delete(COLLECTIONS.RESERVATIONS, id)];
            });
        });
    };
    ReservationService.onSnapshot = function (callback, errorCallback) {
        return FirebaseService.onSnapshot(COLLECTIONS.RESERVATIONS, callback, errorCallback);
    };
    ReservationService.onSnapshotByUser = function (userId, callback, errorCallback) {
        return FirebaseService.onSnapshotByUser(COLLECTIONS.RESERVATIONS, userId, callback, errorCallback);
    };
    // Get reservations by status
    ReservationService.getByStatus = function (status) {
        return __awaiter(this, void 0, void 0, function () {
            var q, querySnapshot, error_9;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        q = (0, firestore_1.query)((0, firestore_1.collection)(firebase_1.db, COLLECTIONS.RESERVATIONS), (0, firestore_1.where)('statut', '==', status), (0, firestore_1.orderBy)('createdAt', 'desc'));
                        return [4 /*yield*/, (0, firestore_1.getDocs)(q)];
                    case 1:
                        querySnapshot = _a.sent();
                        return [2 /*return*/, querySnapshot.docs.map(function (doc) { return (__assign({ id: doc.id }, doc.data())); })];
                    case 2:
                        error_9 = _a.sent();
                        console.error('Error getting reservations by status:', error_9);
                        throw new Error("Erreur lors de la r\u00E9cup\u00E9ration des r\u00E9servations: ".concat(error_9 instanceof Error ? error_9.message : 'Erreur inconnue'));
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    // Get reservations by status and userId
    ReservationService.getByStatusAndUser = function (status, userId) {
        return __awaiter(this, void 0, void 0, function () {
            var q, querySnapshot, error_10;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        q = (0, firestore_1.query)((0, firestore_1.collection)(firebase_1.db, COLLECTIONS.RESERVATIONS), (0, firestore_1.where)('statut', '==', status), (0, firestore_1.where)('userId', '==', userId), (0, firestore_1.orderBy)('createdAt', 'desc'));
                        return [4 /*yield*/, (0, firestore_1.getDocs)(q)];
                    case 1:
                        querySnapshot = _a.sent();
                        return [2 /*return*/, querySnapshot.docs.map(function (doc) { return (__assign({ id: doc.id }, doc.data())); })];
                    case 2:
                        error_10 = _a.sent();
                        console.error('Error getting reservations by status and user:', error_10);
                        throw new Error("Erreur lors de la r\u00E9cup\u00E9ration des r\u00E9servations: ".concat(error_10 instanceof Error ? error_10.message : 'Erreur inconnue'));
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    // Upload EDL files
    ReservationService.uploadEDLFile = function (reservationId, file, type, name) {
        return __awaiter(this, void 0, void 0, function () {
            var path;
            return __generator(this, function (_a) {
                path = "reservations/".concat(reservationId, "/edl/").concat(type, "_").concat(name, "_").concat(Date.now());
                return [2 /*return*/, FirebaseService.uploadFile(file, path)];
            });
        });
    };
    // Planifier la suppression de fichiers
    ReservationService.scheduleFileDeletion = function (reservationId, filePaths, deleteAfter) {
        return __awaiter(this, void 0, void 0, function () {
            var error_11;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        // Créer un document dans la collection 'fileDeletions'
                        return [4 /*yield*/, (0, firestore_1.addDoc)((0, firestore_1.collection)(firebase_1.db, 'fileDeletions'), {
                                reservationId: reservationId,
                                filePaths: filePaths,
                                deleteAfter: firestore_1.Timestamp.fromDate(deleteAfter),
                                createdAt: firestore_1.Timestamp.now(),
                                processed: false
                            })];
                    case 1:
                        // Créer un document dans la collection 'fileDeletions'
                        _a.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        error_11 = _a.sent();
                        console.error('Error scheduling file deletion:', error_11);
                        throw new Error("Failed to schedule file deletion: ".concat(error_11 instanceof Error ? error_11.message : 'Unknown error'));
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    return ReservationService;
}());
exports.ReservationService = ReservationService;
var EntrepriseService = /** @class */ (function () {
    function EntrepriseService() {
    }
    EntrepriseService.create = function (entreprise) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, FirebaseService.create(COLLECTIONS.ENTREPRISES, entreprise)];
            });
        });
    };
    EntrepriseService.getByUserId = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var docRef, docSnap, error_12;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        docRef = (0, firestore_1.doc)(firebase_1.db, COLLECTIONS.ENTREPRISES, userId);
                        return [4 /*yield*/, (0, firestore_1.getDoc)(docRef)];
                    case 1:
                        docSnap = _a.sent();
                        if (docSnap.exists()) {
                            return [2 /*return*/, __assign({ id: docSnap.id }, docSnap.data())];
                        }
                        return [2 /*return*/, null];
                    case 2:
                        error_12 = _a.sent();
                        console.error('Error getting entreprise by userId:', error_12);
                        throw new Error("Erreur lors de la r\u00E9cup\u00E9ration: ".concat(error_12 instanceof Error ? error_12.message : 'Erreur inconnue'));
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    EntrepriseService.update = function (id, entreprise) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, FirebaseService.update(COLLECTIONS.ENTREPRISES, id, entreprise)];
            });
        });
    };
    EntrepriseService.onSnapshot = function (callback, errorCallback) {
        return FirebaseService.onSnapshot(COLLECTIONS.ENTREPRISES, callback, errorCallback);
    };
    EntrepriseService.onSnapshotByUser = function (userId, callback, errorCallback) {
        return FirebaseService.onSnapshotByUser(COLLECTIONS.ENTREPRISES, userId, callback, errorCallback);
    };
    // Upload logo
    EntrepriseService.uploadLogo = function (userId, file) {
        return __awaiter(this, void 0, void 0, function () {
            var path;
            return __generator(this, function (_a) {
                path = "entreprises/".concat(userId, "/logo");
                return [2 /*return*/, FirebaseService.uploadFile(file, path)];
            });
        });
    };
    return EntrepriseService;
}());
exports.EntrepriseService = EntrepriseService;
function seedAbonnementsPlans() {
    return __awaiter(this, void 0, void 0, function () {
        var plans, _loop_1, _i, plans_1, plan;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    plans = [
                        {
                            nom: 'Gratuit',
                            prixMensuel: 0,
                            description: 'Découverte EasyGarage',
                            vehiculesMax: 1,
                            reservationsMax: 5,
                            utilisateursMax: 1,
                            dureeStockageEDL: '24h',
                            exportAutorisé: false,
                            personnalisationVisuelle: false,
                            multiSociete: false,
                            support: 'email',
                        },
                        {
                            nom: 'Essentiel',
                            prixMensuel: 9.99,
                            description: 'Pour les petits loueurs',
                            vehiculesMax: 5,
                            reservationsMax: 50,
                            utilisateursMax: 1,
                            dureeStockageEDL: '7 jours',
                            exportAutorisé: true,
                            personnalisationVisuelle: true,
                            multiSociete: false,
                            support: 'email',
                        },
                        {
                            nom: 'Pro',
                            prixMensuel: 19.99,
                            description: 'Pour les pros exigeants',
                            vehiculesMax: 30,
                            reservationsMax: 'illimité',
                            utilisateursMax: 5,
                            dureeStockageEDL: '1 mois',
                            exportAutorisé: true,
                            personnalisationVisuelle: true,
                            multiSociete: false,
                            support: 'prioritaire',
                        },
                        {
                            nom: 'Premium',
                            prixMensuel: 39.99,
                            description: 'Pour les groupes et franchises',
                            vehiculesMax: 'illimité',
                            reservationsMax: 'illimité',
                            utilisateursMax: 'illimité',
                            dureeStockageEDL: '1 an',
                            exportAutorisé: true,
                            personnalisationVisuelle: true,
                            multiSociete: true,
                            support: 'téléphone',
                        },
                    ];
                    _loop_1 = function (plan) {
                        var existing;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0: return [4 /*yield*/, FirebaseService.getAll('Abonnements')];
                                case 1:
                                    existing = _b.sent();
                                    if (existing.some(function (p) { return p.nom === plan.nom; }))
                                        return [2 /*return*/, "continue"];
                                    return [4 /*yield*/, FirebaseService.create('Abonnements', plan)];
                                case 2:
                                    _b.sent();
                                    return [2 /*return*/];
                            }
                        });
                    };
                    _i = 0, plans_1 = plans;
                    _a.label = 1;
                case 1:
                    if (!(_i < plans_1.length)) return [3 /*break*/, 4];
                    plan = plans_1[_i];
                    return [5 /*yield**/, _loop_1(plan)];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4:
                    console.log('Plans d\'abonnement Firestore initialisés.');
                    return [2 /*return*/];
            }
        });
    });
}
exports.seedAbonnementsPlans = seedAbonnementsPlans;
