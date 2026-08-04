import { useState, useEffect, useMemo, useRef, type ChangeEvent, type FormEvent } from "react";
import { 
  Truck, 
  Calendar, 
  Search, 
  User, 
  Plus, 
  Trash2, 
  Download, 
  Upload, 
  Info, 
  FileDown, 
  CheckCircle, 
  AlertCircle, 
  SlidersHorizontal,
  FileCheck,
  Pencil,
  X,
  Lock,
  LogOut,
  Eye,
  EyeOff,
  Users,
  Shield,
  UserPlus,
  Key,
  MapPin,
  Building2,
  Menu,
  Settings
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

// Define strict TypeScript interface for transport services
interface Servicio {
  id: string;
  fecha: string; // YYYY-MM-DD
  numServicio: string;
  razonSocial: string;
  regionComuna: string; // New field for region/commune
  servicioRealizado: string;
  numSidrep: string;
  pesoEstimado: string;
  numGuia: string;
  conductor: string; // Renamed from chofer according to instructions
  patente?: string; // Matrícula/Patente del vehículo del servicio
}

// Define interface for system users
interface Usuario {
  id: string;
  usuario: string;
  nombre: string;
  contrasena: string;
  rol: "Administrador" | "Operador" | "Conductor";
}

// Initial seed data with "conductor" and "patente"
const DEFAULTS_SERVICIOS: Servicio[] = [
  {
    id: "1",
    fecha: "2026-07-01",
    numServicio: "1250",
    razonSocial: "Minera del Norte S.A.",
    regionComuna: "Antofagasta / Sierra Gorda",
    servicioRealizado: "Traslado de concentrado de cobre y retiro de residuos",
    numSidrep: "SD-44510",
    pesoEstimado: "4500",
    numGuia: "GD-778901",
    conductor: "Carlos Mendoza",
    patente: "TFTB63"
  },
  {
    id: "2",
    fecha: "2026-07-01",
    numServicio: "1251",
    razonSocial: "Distribuidora del Sur",
    regionComuna: "Biobío / Concepción",
    servicioRealizado: "Flete de mercadería seca y paletizada",
    numSidrep: "N/A",
    pesoEstimado: "0",
    numGuia: "GD-778902",
    conductor: "Juan Pablo Silva",
    patente: "TFTB63"
  },
  {
    id: "3",
    fecha: "2026-07-02",
    numServicio: "1252",
    razonSocial: "Constructora Cordillera",
    regionComuna: "Metropolitana / Colina",
    servicioRealizado: "Transporte de maquinaria pesada a faena",
    numSidrep: "N/A",
    pesoEstimado: "0",
    numGuia: "GD-778915",
    conductor: "Carlos Mendoza",
    patente: "GHJK12"
  },
  {
    id: "4",
    fecha: "2026-06-28",
    numServicio: "1210",
    razonSocial: "Industrias Químicas Omega",
    regionComuna: "Valparaíso / Quintero",
    servicioRealizado: "Despacho de sustancias peligrosas en estanques",
    numSidrep: "SD-44320",
    pesoEstimado: "8200",
    numGuia: "GD-775402",
    conductor: "Mauricio Ortega",
    patente: "TFTB63"
  }
];

export default function App() {
  // Principal state for services with LocalStorage backup
  const [servicios, setServicios] = useState<Servicio[]>(() => {
    const saved = localStorage.getItem("servicios_via_limpia_v1");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Error reading from localstorage", e);
      }
    }
    return DEFAULTS_SERVICIOS;
  });

  // Sync state with localStorage
  useEffect(() => {
    localStorage.setItem("servicios_via_limpia_v1", JSON.stringify(servicios));
  }, [servicios]);

  // Reusable Catalog Item definition
  const [catConductores, setCatConductores] = useState<{ id: string; nombre: string }[]>(() => {
    const saved = localStorage.getItem("vialimpia_cat_conductores");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return [
      { id: "c1", nombre: "Carlos Mendoza" },
      { id: "c2", nombre: "Juan Pablo Silva" },
      { id: "c3", nombre: "Mauricio Ortega" },
      { id: "c4", nombre: "Andrés Castro" },
      { id: "c5", nombre: "Roberto Gómez" }
    ];
  });

  const [catClientes, setCatClientes] = useState<{ id: string; nombre: string }[]>(() => {
    const saved = localStorage.getItem("vialimpia_cat_clientes");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return [
      { id: "cl1", nombre: "Minera del Norte S.A." },
      { id: "cl2", nombre: "Distribuidora del Sur" },
      { id: "cl3", nombre: "Constructora Cordillera" },
      { id: "cl4", nombre: "Industrias Químicas Omega" },
      { id: "cl5", nombre: "Transportes TransAtacama" }
    ];
  });

  const [catRegiones, setCatRegiones] = useState<{ id: string; nombre: string }[]>(() => {
    const saved = localStorage.getItem("vialimpia_cat_regiones");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return [
      { id: "r1", nombre: "Antofagasta / Sierra Gorda" },
      { id: "r2", nombre: "Biobío / Concepción" },
      { id: "r3", nombre: "Metropolitana / Colina" },
      { id: "r4", nombre: "Valparaíso / Quintero" },
      { id: "r5", nombre: "Atacama / Copiapó" }
    ];
  });

  // Synchronize catalogs with localStorage
  useEffect(() => {
    localStorage.setItem("vialimpia_cat_conductores", JSON.stringify(catConductores));
  }, [catConductores]);

  useEffect(() => {
    localStorage.setItem("vialimpia_cat_clientes", JSON.stringify(catClientes));
  }, [catClientes]);

  useEffect(() => {
    localStorage.setItem("vialimpia_cat_regiones", JSON.stringify(catRegiones));
  }, [catRegiones]);

  // Company and Vehicle License Plate Configuration State
  const [configEmpresa, setConfigEmpresa] = useState<{ nombreEmpresa: string; patenteVehiculo: string }>(() => {
    const saved = localStorage.getItem("vialimpia_config");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          nombreEmpresa: parsed.nombreEmpresa || "VIA LIMPIA SPA",
          patenteVehiculo: parsed.patenteVehiculo || "TFTB63"
        };
      } catch (e) {
        console.error("Error reading config", e);
      }
    }
    return { nombreEmpresa: "VIA LIMPIA SPA", patenteVehiculo: "TFTB63" };
  });

  useEffect(() => {
    localStorage.setItem("vialimpia_config", JSON.stringify(configEmpresa));
  }, [configEmpresa]);

  // Catalog Active Subtab state
  const [tabActivoNomenclador, setTabActivoNomenclador] = useState<"conductores" | "clientes" | "regiones">("conductores");
  
  // Nomenclador creation states
  const [nuevoNomencladorNombre, setNuevoNomencladorNombre] = useState<string>("");
  const [editandoNomencladorId, setEditandoNomencladorId] = useState<string | null>(null);
  const [editandoNomencladorNombre, setEditandoNomencladorNombre] = useState<string>("");

  // Simulated Asynchronous Processing states
  const [asyncOperando, setAsyncOperando] = useState<boolean>(false);
  const [asyncMensaje, setAsyncMensaje] = useState<string>("");

  // Asynchronous wrapper simulating secure database writes
  const ejecutarOperacionAsincrona = async (mensaje: string, accion: () => void) => {
    setAsyncOperando(true);
    setAsyncMensaje(mensaje);
    await new Promise(resolve => setTimeout(resolve, 800));
    try {
      accion();
    } catch (err) {
      console.error(err);
      triggerNotificacion("Error en la transacción segura de datos.", "error");
    } finally {
      setAsyncOperando(false);
      setAsyncMensaje("");
    }
  };

  // Toggle mode states for forms (select from catalog vs custom inputs)
  const [inputModeConductor, setInputModeConductor] = useState<"select" | "custom">("select");
  const [inputModeCliente, setInputModeCliente] = useState<"select" | "custom">("select");
  const [inputModeRegion, setInputModeRegion] = useState<"select" | "custom">("select");

  const [editInputModeConductor, setEditInputModeConductor] = useState<"select" | "custom">("select");
  const [editInputModeCliente, setEditInputModeCliente] = useState<"select" | "custom">("select");
  const [editInputModeRegion, setEditInputModeRegion] = useState<"select" | "custom">("select");

  // Form input state
  const [formData, setFormData] = useState<Omit<Servicio, "id">>({
    fecha: new Date().toISOString().split("T")[0],
    numServicio: "",
    razonSocial: "",
    regionComuna: "",
    servicioRealizado: "",
    numSidrep: "",
    pesoEstimado: "",
    numGuia: "",
    conductor: "",
    patente: configEmpresa.patenteVehiculo || "TFTB63"
  });

  // Filter & search states
  const [busqueda, setBusqueda] = useState<string>("");
  const [filtroConductor, setFiltroConductor] = useState<string>("Todos");
  const [filtroServicio, setFiltroServicio] = useState<string>("Todos");
  const [filtroPatente, setFiltroPatente] = useState<string>("Todos");

  // PDF report settings
  const [reporteTipo, setReporteTipo] = useState<"dia" | "rango" | "mes">("mes");
  const [reporteFechaDia, setReporteFechaDia] = useState<string>(new Date().toISOString().split("T")[0]);
  const [reporteFechaInicio, setReporteFechaInicio] = useState<string>("");
  const [reporteFechaFin, setReporteFechaFin] = useState<string>("");
  const [reporteMes, setReporteMes] = useState<string>(new Date().toISOString().substring(0, 7));
  const [reporteServicio, setReporteServicio] = useState<string>("Todos");
  const [reportePatente, setReportePatente] = useState<string>("Todos");

  // Modal and references
  const [mostrarAyudaPDF, setMostrarAyudaPDF] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Notification state
  const [notificacion, setNotificacion] = useState<{ mensaje: string; tipo: "success" | "error" | "info" } | null>(null);

  const triggerNotificacion = (mensaje: string, tipo: "success" | "error" | "info" = "success") => {
    setNotificacion({ mensaje, tipo });
    setTimeout(() => setNotificacion(null), 4000);
  };

  // System Users State with localStorage synchronization
  const [usuarios, setUsuarios] = useState<Usuario[]>(() => {
    const saved = localStorage.getItem("vialimpia_usuarios_v2");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Error reading users database", e);
      }
    }
    return [
      {
        id: "admin-default",
        usuario: "admin",
        nombre: "Administrador Sistema",
        contrasena: "admin123",
        rol: "Administrador"
      }
    ];
  });

  // Sync users to localStorage
  useEffect(() => {
    localStorage.setItem("vialimpia_usuarios_v2", JSON.stringify(usuarios));
  }, [usuarios]);

  // Logged in User state
  const [usuarioActual, setUsuarioActual] = useState<Usuario | null>(() => {
    const savedId = localStorage.getItem("vialimpia_logged_user_id_v2");
    if (savedId) {
      const savedUsersStr = localStorage.getItem("vialimpia_usuarios_v2");
      if (savedUsersStr) {
        try {
          const parsedUsers = JSON.parse(savedUsersStr) as Usuario[];
          const found = parsedUsers.find(u => u.id === savedId);
          if (found) return found;
        } catch (e) {
          console.error("Error restoring session", e);
        }
      }
      // Fallback
      if (savedId === "admin-default") {
        return {
          id: "admin-default",
          usuario: "admin",
          nombre: "Administrador Sistema",
          contrasena: "admin123",
          rol: "Administrador"
        };
      }
    }
    return null;
  });

  const isLoggedIn = !!usuarioActual;

  // Navigation state
  const [vistaActiva, setVistaActiva] = useState<"servicios" | "usuarios" | "nomencladores" | "configuracion">("servicios");

  // User form states (for creating a user)
  const [nuevoNombre, setNuevoNombre] = useState<string>("");
  const [nuevoUsuario, setNuevoUsuario] = useState<string>("");
  const [nuevaContrasena, setNuevaContrasena] = useState<string>("");
  const [nuevoRol, setNuevoRol] = useState<"Administrador" | "Operador" | "Conductor">("Operador");

  // User edit modal states
  const [usuarioEditando, setUsuarioEditando] = useState<Usuario | null>(null);

  // User Profile States
  const [mostrarMenuPerfil, setMostrarMenuPerfil] = useState<boolean>(false);
  const [menuMovilAbierto, setMenuMovilAbierto] = useState<boolean>(false);
  const [editandoPerfil, setEditandoPerfil] = useState<boolean>(false);
  const [perfilNombre, setPerfilNombre] = useState<string>("");
  const [perfilUsuario, setPerfilUsuario] = useState<string>("");
  const [perfilContrasena, setPerfilContrasena] = useState<string>("");

  const iniciarEdicionPerfil = () => {
    if (usuarioActual) {
      setPerfilNombre(usuarioActual.nombre);
      setPerfilUsuario(usuarioActual.usuario);
      setPerfilContrasena(usuarioActual.contrasena);
      setEditandoPerfil(true);
      setMostrarMenuPerfil(false);
    }
  };

  const handleGuardarPerfil = (e: FormEvent) => {
    e.preventDefault();
    if (!usuarioActual) return;
    if (!perfilNombre.trim() || !perfilUsuario.trim() || !perfilContrasena.trim()) {
      triggerNotificacion("Todos los campos del perfil son obligatorios.", "error");
      return;
    }

    const cleanUsername = perfilUsuario.trim().toLowerCase();

    // Check duplication excluding self
    if (usuarios.some(u => u.usuario.toLowerCase() === cleanUsername && u.id !== usuarioActual.id)) {
      triggerNotificacion("El nombre de usuario ya está en uso.", "error");
      return;
    }

    const perfilActualizado: Usuario = {
      ...usuarioActual,
      nombre: perfilNombre.trim(),
      usuario: cleanUsername,
      contrasena: perfilContrasena.trim()
    };

    // Update in usuarios database state
    setUsuarios(prev => prev.map(u => u.id === usuarioActual.id ? perfilActualizado : u));
    // Update active user state
    setUsuarioActual(perfilActualizado);

    triggerNotificacion("¡Tu perfil ha sido actualizado con éxito!", "success");
    setEditandoPerfil(false);
  };

  // Authentication logic
  const [usernameInput, setUsernameInput] = useState<string>("");
  const [passwordInput, setPasswordInput] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loginError, setLoginError] = useState<string>("");

  const handleLogin = (e: FormEvent) => {
    e.preventDefault();
    const cleanUser = usernameInput.trim().toLowerCase();
    const matchedUser = usuarios.find(
      u => u.usuario.trim().toLowerCase() === cleanUser && u.contrasena === passwordInput
    );

    if (matchedUser) {
      setUsuarioActual(matchedUser);
      localStorage.setItem("vialimpia_logged_user_id_v2", matchedUser.id);
      setLoginError("");
      setUsernameInput("");
      setPasswordInput("");
      triggerNotificacion(`¡Sesión iniciada como ${matchedUser.nombre}!`, "success");
    } else {
      setLoginError("Usuario o contraseña incorrectos.");
      triggerNotificacion("Credenciales incorrectas.", "error");
    }
  };

  const handleLogout = () => {
    if (window.confirm("¿Está seguro de que desea cerrar la sesión?")) {
      setUsuarioActual(null);
      localStorage.removeItem("vialimpia_logged_user_id_v2");
      setVistaActiva("servicios");
      triggerNotificacion("Sesión cerrada.", "info");
    }
  };

  // User Management Actions
  const handleCrearUsuario = (e: FormEvent) => {
    e.preventDefault();
    if (!nuevoNombre.trim() || !nuevoUsuario.trim() || !nuevaContrasena.trim()) {
      triggerNotificacion("Por favor completa todos los campos del nuevo usuario.", "error");
      return;
    }

    const cleanUsername = nuevoUsuario.trim().toLowerCase();
    
    // Check duplication
    if (usuarios.some(u => u.usuario.toLowerCase() === cleanUsername)) {
      triggerNotificacion("El nombre de usuario ya existe.", "error");
      return;
    }

    const newUser: Usuario = {
      id: Date.now().toString(),
      nombre: nuevoNombre.trim(),
      usuario: cleanUsername,
      contrasena: nuevaContrasena,
      rol: nuevoRol
    };

    setUsuarios(prev => [...prev, newUser]);
    triggerNotificacion(`Usuario "${newUser.nombre}" creado con éxito.`);
    
    // Reset fields
    setNuevoNombre("");
    setNuevoUsuario("");
    setNuevaContrasena("");
    setNuevoRol("Operador");
  };

  const handleGuardarEditUsuario = (e: FormEvent) => {
    e.preventDefault();
    if (!usuarioEditando) return;

    if (!usuarioEditando.nombre.trim() || !usuarioEditando.usuario.trim() || !usuarioEditando.contrasena.trim()) {
      triggerNotificacion("Todos los campos del usuario son obligatorios.", "error");
      return;
    }

    const cleanUsername = usuarioEditando.usuario.trim().toLowerCase();

    // Check duplication excluding self
    if (usuarios.some(u => u.usuario.toLowerCase() === cleanUsername && u.id !== usuarioEditando.id)) {
      triggerNotificacion("El nombre de usuario ya está en uso.", "error");
      return;
    }

    setUsuarios(prev => prev.map(u => u.id === usuarioEditando.id ? usuarioEditando : u));
    
    // If we edited ourselves, update the active user info
    if (usuarioActual && usuarioActual.id === usuarioEditando.id) {
      setUsuarioActual(usuarioEditando);
    }

    triggerNotificacion("Usuario actualizado con éxito.");
    setUsuarioEditando(null);
  };

  const handleEliminarUsuario = (userId: string) => {
    if (userId === "admin-default") {
      triggerNotificacion("No puedes eliminar al administrador del sistema por defecto.", "error");
      return;
    }
    if (usuarioActual && usuarioActual.id === userId) {
      triggerNotificacion("No puedes eliminar a tu propio usuario activo.", "error");
      return;
    }

    if (window.confirm("¿Está seguro de que desea eliminar permanentemente este usuario?")) {
      setUsuarios(prev => prev.filter(u => u.id !== userId));
      triggerNotificacion("Usuario eliminado.");
    }
  };

  const tienePermisoEscritura = usuarioActual?.rol === "Administrador" || usuarioActual?.rol === "Operador";

  // CRUD actions for reusable catalogs (Nomencladores)
  const handleCrearElementoNomenclador = (e: FormEvent) => {
    e.preventDefault();
    if (!tienePermisoEscritura) {
      triggerNotificacion("No tienes permisos para modificar catálogos.", "error");
      return;
    }
    if (!nuevoNomencladorNombre.trim()) {
      triggerNotificacion("El nombre no puede estar vacío.", "error");
      return;
    }

    const nuevoItem = {
      id: Date.now().toString(),
      nombre: nuevoNomencladorNombre.trim()
    };

    ejecutarOperacionAsincrona("Guardando nuevo elemento en catálogo de forma segura...", () => {
      if (tabActivoNomenclador === "conductores") {
        setCatConductores(prev => [...prev, nuevoItem]);
      } else if (tabActivoNomenclador === "clientes") {
        setCatClientes(prev => [...prev, nuevoItem]);
      } else if (tabActivoNomenclador === "regiones") {
        setCatRegiones(prev => [...prev, nuevoItem]);
      }
      setNuevoNomencladorNombre("");
      triggerNotificacion("Elemento agregado correctamente.");
    });
  };

  const handleIniciarEditarNomenclador = (item: { id: string; nombre: string }) => {
    if (!tienePermisoEscritura) {
      triggerNotificacion("No tienes permisos para modificar catálogos.", "error");
      return;
    }
    setEditandoNomencladorId(item.id);
    setEditandoNomencladorNombre(item.nombre);
  };

  const handleGuardarEditarNomenclador = (e: FormEvent) => {
    e.preventDefault();
    if (!tienePermisoEscritura) {
      triggerNotificacion("No tienes permisos para modificar catálogos.", "error");
      return;
    }
    if (!editandoNomencladorNombre.trim()) {
      triggerNotificacion("El nombre no puede estar vacío.", "error");
      return;
    }

    ejecutarOperacionAsincrona("Actualizando catálogo de forma asíncrona...", () => {
      const updateFn = (prev: { id: string; nombre: string }[]) =>
        prev.map(i => i.id === editandoNomencladorId ? { ...i, nombre: editandoNomencladorNombre.trim() } : i);

      if (tabActivoNomenclador === "conductores") {
        setCatConductores(updateFn);
      } else if (tabActivoNomenclador === "clientes") {
        setCatClientes(updateFn);
      } else if (tabActivoNomenclador === "regiones") {
        setCatRegiones(updateFn);
      }
      setEditandoNomencladorId(null);
      setEditandoNomencladorNombre("");
      triggerNotificacion("Catálogo actualizado.");
    });
  };

  const handleEliminarElementoNomenclador = (id: string, nombre: string) => {
    if (!tienePermisoEscritura) {
      triggerNotificacion("No tienes permisos para modificar catálogos.", "error");
      return;
    }
    if (window.confirm(`¿Está seguro de que desea eliminar permanentemente "${nombre}" de este catálogo?`)) {
      ejecutarOperacionAsincrona("Eliminando elemento de forma segura...", () => {
        const deleteFn = (prev: { id: string; nombre: string }[]) => prev.filter(i => i.id !== id);

        if (tabActivoNomenclador === "conductores") {
          setCatConductores(deleteFn);
        } else if (tabActivoNomenclador === "clientes") {
          setCatClientes(deleteFn);
        } else if (tabActivoNomenclador === "regiones") {
          setCatRegiones(deleteFn);
        }
        triggerNotificacion("Elemento eliminado con éxito.");
      });
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Edit service states
  const [editandoServicio, setEditandoServicio] = useState<Servicio | null>(null);
  const [editFormData, setEditFormData] = useState<Servicio | null>(null);

  const iniciarEdicion = (servicio: Servicio) => {
    setEditandoServicio(servicio);
    setEditFormData({
      ...servicio,
      patente: servicio.patente || configEmpresa.patenteVehiculo || "TFTB63"
    });
  };

  const handleEditInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!editFormData) return;
    const { name, value } = e.target;
    setEditFormData(prev => {
      if (!prev) return null;
      return {
        ...prev,
        [name]: value
      };
    });
  };

  // Manage SIDREP on editing form
  useEffect(() => {
    if (editFormData && (!editFormData.numSidrep || !editFormData.numSidrep.trim() || editFormData.numSidrep === "N/A")) {
      // Don't auto reset during load if it's already "N/A"
      // But if user cleared it, make sure pesoEstimado goes to "0"
      if (editFormData.numSidrep === "") {
        setEditFormData(prev => {
          if (!prev) return null;
          return { ...prev, pesoEstimado: "0" };
        });
      }
    }
  }, [editFormData?.numSidrep]);

  const handleGuardarEdicion = (e: FormEvent) => {
    e.preventDefault();
    if (!editFormData) return;

    if (!editFormData.fecha || !editFormData.numServicio || !editFormData.patente || !editFormData.razonSocial || !editFormData.servicioRealizado || !editFormData.conductor) {
      triggerNotificacion("Por favor completa todos los campos obligatorios (*).", "error");
      return;
    }

    const servicioGuardado: Servicio = {
      ...editFormData,
      patente: (editFormData.patente || configEmpresa.patenteVehiculo || "TFTB63").trim().toUpperCase(),
      numSidrep: editFormData.numSidrep.trim() || "N/A",
      pesoEstimado: editFormData.numSidrep.trim() && editFormData.numSidrep !== "N/A" ? (editFormData.pesoEstimado || "0") : "0",
      numGuia: editFormData.numGuia.trim() || "N/A",
      conductor: editFormData.conductor.trim()
    };

    setServicios(prev => prev.map(s => s.id === servicioGuardado.id ? servicioGuardado : s));
    triggerNotificacion("¡Registro de servicio actualizado con éxito!");
    setEditandoServicio(null);
    setEditFormData(null);
  };

  // On SIDREP changes, reset/manage pesoEstimado
  useEffect(() => {
    if (!formData.numSidrep.trim()) {
      setFormData(prev => ({ ...prev, pesoEstimado: "" }));
    }
  }, [formData.numSidrep]);

  // Add new service
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!formData.fecha || !formData.numServicio || !formData.patente || !formData.razonSocial || !formData.regionComuna || !formData.servicioRealizado || !formData.conductor) {
      triggerNotificacion("Por favor completa todos los campos obligatorios (*).", "error");
      return;
    }

    const nuevoServicio: Servicio = {
      ...formData,
      id: Date.now().toString(),
      patente: (formData.patente || configEmpresa.patenteVehiculo || "TFTB63").trim().toUpperCase(),
      numSidrep: formData.numSidrep.trim() || "N/A",
      pesoEstimado: formData.numSidrep.trim() ? (formData.pesoEstimado || "0") : "0",
      numGuia: formData.numGuia.trim() || "N/A",
      conductor: formData.conductor.trim()
    };

    setServicios(prev => [nuevoServicio, ...prev]);
    triggerNotificacion("¡Servicio ingresado y guardado correctamente!");

    // Reset keeping date, conductor, and patente for fast repetitive logging
    setFormData(prev => ({
      fecha: prev.fecha,
      numServicio: "",
      razonSocial: "",
      regionComuna: "",
      servicioRealizado: "",
      numSidrep: "",
      pesoEstimado: "",
      numGuia: "",
      conductor: prev.conductor,
      patente: prev.patente || configEmpresa.patenteVehiculo || "TFTB63"
    }));
  };

  // Delete a service
  const handleEliminar = (id: string) => {
    if (window.confirm("¿Está seguro de que desea eliminar permanentemente este registro de servicio?")) {
      setServicios(prev => prev.filter(s => s.id !== id));
      triggerNotificacion("Registro de servicio eliminado.", "info");
    }
  };

  // Export local JSON DB (Servicios + Nomencladores + Configuración)
  const exportarBaseDatos = () => {
    try {
      const backupData = {
        version: "2.6",
        fechaRespaldo: new Date().toISOString(),
        configuracion: configEmpresa,
        servicios: servicios,
        catalogos: {
          conductores: catConductores,
          clientes: catClientes,
          regiones: catRegiones
        }
      };

      const dataStr = JSON.stringify(backupData, null, 2);
      const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
      const nombreEmpresaClean = configEmpresa.nombreEmpresa.replace(/\s+/g, "_");
      const nombreArchivo = `BD_${nombreEmpresaClean}_${configEmpresa.patenteVehiculo}_${new Date().toISOString().split("T")[0]}.json`;

      const linkElement = document.createElement("a");
      linkElement.setAttribute("href", dataUri);
      linkElement.setAttribute("download", nombreArchivo);
      linkElement.click();

      triggerNotificacion("Base de datos, catálogos y configuración exportados con éxito.");
    } catch (error) {
      triggerNotificacion("Ocurrió un error al exportar la base de datos.", "error");
    }
  };

  // Import local JSON DB (Servicios + Nomencladores)
  const importarBaseDatos = (e: ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    const file = e.target.files?.[0];
    if (!file) return;

    fileReader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        
        // Case 1: Legacy format (direct array of service records)
        if (Array.isArray(parsed)) {
          const valid = parsed.every(item => item.fecha && item.numServicio && item.razonSocial && (item.conductor || item.chofer));
          if (valid) {
            if (window.confirm(`Se cargarán ${parsed.length} registros de servicios. Esto reemplazará tu base de datos actual. ¿Deseas continuar?`)) {
              const migracion = parsed.map(item => ({
                ...item,
                regionComuna: item.regionComuna || "N/A",
                conductor: item.conductor || item.chofer || "Sin Conductor",
                patente: (item.patente || item.patenteVehiculo || configEmpresa.patenteVehiculo || "TFTB63").toUpperCase()
              }));
              setServicios(migracion);
              triggerNotificacion("Base de datos importada y restaurada con éxito.");
            }
          } else {
            triggerNotificacion("El archivo no tiene el formato correcto de base de datos.", "error");
          }
        } 
        // Case 2: Structured backup object containing servicios & catalogos
        else if (parsed && typeof parsed === "object") {
          const rawServicios = parsed.servicios || parsed.data || [];
          if (!Array.isArray(rawServicios)) {
            triggerNotificacion("El archivo de respaldo no contiene una lista de servicios válida.", "error");
            return;
          }

          const valid = rawServicios.every((item: any) => item.fecha && item.numServicio && item.razonSocial && (item.conductor || item.chofer));
          if (!valid && rawServicios.length > 0) {
            triggerNotificacion("El archivo no tiene el formato correcto de registros de servicios.", "error");
            return;
          }

          const numServs = rawServicios.length;
          const tieneCatalogos = parsed.catalogos && typeof parsed.catalogos === "object";
          
          let msj = `Se restaurarán ${numServs} registros de servicios`;
          if (tieneCatalogos) {
            msj += ` y todos los catálogos de nomencladores (Conductores, Clientes, Regiones)`;
          }
          msj += `. Esto reemplazará los datos actuales. ¿Deseas continuar?`;

          if (window.confirm(msj)) {
            const migracion = rawServicios.map((item: any) => ({
              ...item,
              regionComuna: item.regionComuna || "N/A",
              conductor: item.conductor || item.chofer || "Sin Conductor",
              patente: (item.patente || item.patenteVehiculo || configEmpresa.patenteVehiculo || "TFTB63").toUpperCase()
            }));
            setServicios(migracion);

            if (tieneCatalogos) {
              if (Array.isArray(parsed.catalogos.conductores)) {
                setCatConductores(parsed.catalogos.conductores);
              }
              if (Array.isArray(parsed.catalogos.clientes)) {
                setCatClientes(parsed.catalogos.clientes);
              }
              if (Array.isArray(parsed.catalogos.regiones)) {
                setCatRegiones(parsed.catalogos.regiones);
              }
            }

            if (parsed.configuracion && typeof parsed.configuracion === "object") {
              setConfigEmpresa({
                nombreEmpresa: parsed.configuracion.nombreEmpresa || "VIA LIMPIA SPA",
                patenteVehiculo: parsed.configuracion.patenteVehiculo || "TFTB63"
              });
            }

            triggerNotificacion("¡Base de datos, catálogos y configuración restaurados tal cual con éxito!");
          }
        } else {
          triggerNotificacion("El archivo JSON no contiene un formato de respaldo válido.", "error");
        }
      } catch (error) {
        triggerNotificacion("No se pudo leer el archivo JSON.", "error");
      }
    };
    fileReader.readAsText(file);
    e.target.value = "";
  };

  // Unique list of vehicle license plates / matrículas for interactive filters
  const listaPatentes = useMemo(() => {
    const patentes = servicios
      .map(s => (s.patente || configEmpresa.patenteVehiculo || "TFTB63").trim().toUpperCase())
      .filter(Boolean);
    return ["Todos", ...Array.from(new Set(patentes))];
  }, [servicios, configEmpresa.patenteVehiculo]);

  // Unique list of conductors for interactive filters
  const listaConductores = useMemo(() => {
    const conds = servicios.map(s => s.conductor.trim()).filter(Boolean);
    return ["Todos", ...Array.from(new Set(conds))];
  }, [servicios]);

  // Unique list of services for interactive filters and report parameters
  const listaServiciosUnicos = useMemo(() => {
    const servs = servicios.map(s => s.servicioRealizado.trim()).filter(Boolean);
    return ["Todos", ...Array.from(new Set(servs))];
  }, [servicios]);

  // Main UI Filter Logic
  const serviciosFiltrados = useMemo(() => {
    return servicios.filter(s => {
      const q = busqueda.toLowerCase();
      const patenteVal = (s.patente || configEmpresa.patenteVehiculo || "TFTB63").toUpperCase();
      const cumpleBusqueda = 
        s.numServicio.toLowerCase().includes(q) ||
        s.razonSocial.toLowerCase().includes(q) ||
        (s.regionComuna && s.regionComuna.toLowerCase().includes(q)) ||
        s.servicioRealizado.toLowerCase().includes(q) ||
        s.numSidrep.toLowerCase().includes(q) ||
        s.numGuia.toLowerCase().includes(q) ||
        s.conductor.toLowerCase().includes(q) ||
        patenteVal.toLowerCase().includes(q);

      const cumpleConductor = filtroConductor === "Todos" || s.conductor === filtroConductor;
      const cumpleServicio = filtroServicio === "Todos" || s.servicioRealizado === filtroServicio;
      const cumplePatente = filtroPatente === "Todos" || patenteVal === filtroPatente.toUpperCase();

      return cumpleBusqueda && cumpleConductor && cumpleServicio && cumplePatente;
    });
  }, [servicios, busqueda, filtroConductor, filtroServicio, filtroPatente, configEmpresa.patenteVehiculo]);

  // Helper date formatter DD/MM/YYYY
  const formatearFecha = (fechaStr: string) => {
    if (!fechaStr) return "";
    const partes = fechaStr.split("-");
    if (partes.length !== 3) return fechaStr;
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  };

  // Format weight to metric standard
  const formatearPeso = (peso: string) => {
    if (!peso || peso === "0" || peso === "N/A") return "N/A";
    return `${Number(peso).toLocaleString("es-CL")} kg`;
  };

  // Calculate sum of weight of all services
  const totalPeso = useMemo(() => {
    return servicios.reduce((acc, s) => {
      const p = parseFloat(s.pesoEstimado);
      return isNaN(p) ? acc : acc + p;
    }, 0);
  }, [servicios]);

  // Helper to extract conductor initials
  const getInitials = (name: string) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
  };

  // Generate Letter-sized PDF report with precise requirements:
  // 1. "conductor" instead of "chofer"
  // 2. Header of report says "Via Limpia TFTB63" instead of "logística camión"
  // 3. Filter by date and optionally by service realizado
  const descargarReportePDF = async () => {
    let datosReporte: Servicio[] = [];
    let subtituloPeriodo = "";

    if (reporteTipo === "dia") {
      if (!reporteFechaDia) {
        triggerNotificacion("Seleccione un día para generar el reporte.", "error");
        return;
      }
      datosReporte = servicios.filter(s => s.fecha === reporteFechaDia);
      subtituloPeriodo = `Día: ${formatearFecha(reporteFechaDia)}`;
    } else if (reporteTipo === "rango") {
      if (!reporteFechaInicio || !reporteFechaFin) {
        triggerNotificacion("Seleccione el rango de fechas completo.", "error");
        return;
      }
      if (reporteFechaInicio > reporteFechaFin) {
        triggerNotificacion("La fecha de inicio no puede ser posterior a la de término.", "error");
        return;
      }
      datosReporte = servicios.filter(s => s.fecha >= reporteFechaInicio && s.fecha <= reporteFechaFin);
      subtituloPeriodo = `Rango: Desde ${formatearFecha(reporteFechaInicio)} hasta ${formatearFecha(reporteFechaFin)}`;
    } else if (reporteTipo === "mes") {
      if (!reporteMes) {
        triggerNotificacion("Seleccione un año y mes para generar el reporte.", "error");
        return;
      }
      datosReporte = servicios.filter(s => s.fecha.startsWith(reporteMes));
      const [ano, mes] = reporteMes.split("-");
      const mesesLabel = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
      ];
      subtituloPeriodo = `Mes: ${mesesLabel[parseInt(mes, 10) - 1]} del ${ano}`;
    }

    if (reporteServicio !== "Todos") {
      datosReporte = datosReporte.filter(s => s.servicioRealizado === reporteServicio);
      subtituloPeriodo += ` | Servicio: ${reporteServicio}`;
    }

    if (reportePatente !== "Todos") {
      datosReporte = datosReporte.filter(s => (s.patente || configEmpresa.patenteVehiculo || "TFTB63").toUpperCase() === reportePatente.toUpperCase());
      subtituloPeriodo += ` | Matrícula: ${reportePatente}`;
    }

    if (datosReporte.length === 0) {
      triggerNotificacion("No se encontraron registros para el periodo y parámetros indicados.", "info");
      return;
    }

    // Sort by date and service ID
    datosReporte.sort((a, b) => {
      if (a.fecha !== b.fecha) {
        return a.fecha.localeCompare(b.fecha);
      }
      return a.numServicio.localeCompare(b.numServicio);
    });

    // Group by date
    const serviciosAgrupados: { [key: string]: Servicio[] } = {};
    datosReporte.forEach(s => {
      if (!serviciosAgrupados[s.fecha]) {
        serviciosAgrupados[s.fecha] = [];
      }
      serviciosAgrupados[s.fecha].push(s);
    });

    // Create custom styled PDF
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "letter" // Standard horizontal letter page
    });

    const colorPrincipal = [2, 132, 199]; // Beautiful corporate Blue (from the Sleek Theme)
    const colorTexto = [15, 23, 42]; // Slate 900
    const colorLineas = [226, 232, 240]; // Slate 200

    const anchoCarta = 279.4;

    // Draw main colored banner header (Landscape Letter has 279.4mm width)
    doc.setFillColor(colorPrincipal[0], colorPrincipal[1], colorPrincipal[2]);
    doc.rect(0, 0, anchoCarta, 24, "F");

    // Title in Header: dynamically uses configured company name
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(`REPORTE OPERATIVO DE SERVICIOS - ${configEmpresa.nombreEmpresa.toUpperCase()}`, 12, 15);

    // Meta-info top right
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    doc.text(`Generado: ${new Date().toLocaleDateString("es-CL")} a las ${new Date().toLocaleTimeString("es-CL")}`, 200, 15);

    // Filter information under the header
    doc.setTextColor(colorTexto[0], colorTexto[1], colorTexto[2]);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);

    doc.text("Periodo del Reporte:", 12, 31);
    doc.setFont("helvetica", "normal");
    doc.text(subtituloPeriodo, 52, 31);

    doc.setFont("helvetica", "bold");
    doc.text("Matrícula / Vehículo:", 12, 37);
    doc.setFont("helvetica", "normal");
    const patenteTextoDoc = reportePatente !== "Todos" 
      ? reportePatente.toUpperCase() 
      : (configEmpresa.patenteVehiculo ? `${configEmpresa.patenteVehiculo.toUpperCase()} (o según servicio)` : "Todas");
    doc.text(patenteTextoDoc, 52, 37);

    doc.setFont("helvetica", "bold");
    doc.text(`Total Servicios: ${datosReporte.length}`, 200, 31);

    // Underline
    doc.setDrawColor(colorLineas[0], colorLineas[1], colorLineas[2]);
    doc.setLineWidth(0.4);
    doc.line(12, 42, anchoCarta - 12, 42);

    let posicionY = 48;

    Object.keys(serviciosAgrupados).forEach((fecha) => {
      const listaDeEstaFecha = serviciosAgrupados[fecha];

      // Page overflow handler (Landscape Letter is 215.9mm height, let's break near 165mm)
      if (posicionY > 165) {
        doc.addPage();
        posicionY = 20;
      }

      // Section date divider
      doc.setTextColor(colorPrincipal[0], colorPrincipal[1], colorPrincipal[2]);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.text(`DÍA DE TRANSPORTE: ${formatearFecha(fecha)}   [${listaDeEstaFecha.length} servicio(s)]`, 12, posicionY);

      posicionY += 4;

      // Table mapping for autoTable
      const filasDeTabla = listaDeEstaFecha.map(item => [
        item.numServicio,
        (item.patente || configEmpresa.patenteVehiculo || "TFTB63").toUpperCase(),
        item.razonSocial,
        item.regionComuna || "N/A",
        item.servicioRealizado,
        item.numSidrep,
        formatearPeso(item.pesoEstimado),
        item.numGuia,
        item.conductor
      ]);

      autoTable(doc, {
        startY: posicionY,
        head: [["N° Serv.", "Matrícula", "Razón Social / Cliente", "Región / Comuna", "Servicio Realizado", "N° SIDREP", "Peso Est.", "N° Guía Despacho", "Conductor"]],
        body: filasDeTabla,
        theme: "striped",
        headStyles: {
          fillColor: [30, 41, 59] as any, // Slate 800 for elegant professional headers
          textColor: [255, 255, 255],
          fontStyle: "bold",
          fontSize: 8
        },
        styles: {
          fontSize: 7.5,
          cellPadding: 2,
          overflow: "linebreak"
        },
        columnStyles: {
          0: { cellWidth: 14 }, // N° Serv
          1: { cellWidth: 18 }, // Matrícula
          2: { cellWidth: 35 }, // Razón Social
          3: { cellWidth: 32 }, // Región / Comuna
          4: { cellWidth: 55 }, // Servicio realizado
          5: { cellWidth: 22 }, // SIDREP
          6: { cellWidth: 20 }, // Peso
          7: { cellWidth: 28 }, // Guía
          8: { cellWidth: 28 }  // Conductor
        },
        margin: { left: 12, right: 12 },
        didDrawPage: function() {
          // Footer page numbering
          doc.setFontSize(7.5);
          doc.setTextColor(100, 116, 139);
          doc.text(
            `Página ${doc.getNumberOfPages()}`, 
            anchoCarta - 12, 
            206, 
            { align: "right" }
          );
        }
      });

      // Update position Y for next group table
      const finalY = (doc as any).lastAutoTable?.finalY;
      posicionY = (finalY || posicionY) + 9;
    });

    const nombreLimpioDefault = `Reporte_Servicios_Via_Limpia_${subtituloPeriodo.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;

    // Attempt to invoke Save File Picker API or fallback to regular download
    if ((window as any).showSaveFilePicker) {
      try {
        const handle = await (window as any).showSaveFilePicker({
          suggestedName: nombreLimpioDefault,
          types: [{
            description: "Documento PDF de Via Limpia (Formato Carta)",
            accept: { "application/pdf": [".pdf"] }
          }]
        });
        const pdfOutput = doc.output("blob");
        const writable = await handle.createWritable();
        await writable.write(pdfOutput);
        await writable.close();
        triggerNotificacion("¡Reporte en formato carta guardado con éxito!");
      } catch (err: any) {
        if (err.name === "AbortError") {
          triggerNotificacion("Guardado cancelado por el usuario.", "info");
        } else {
          doc.save(nombreLimpioDefault);
          triggerNotificacion("¡Guardado estándar completado!");
        }
      }
    } else {
      doc.save(nombreLimpioDefault);
      setMostrarAyudaPDF(true);
      triggerNotificacion("Reporte descargado. Revisa tu carpeta predeterminada.");
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0F172A] font-sans text-slate-100 antialiased relative px-4 overflow-hidden">
        {/* Subtle backdrop gradients */}
        <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-slate-500/10 blur-[120px] pointer-events-none" />

        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative z-10">
          <div className="text-center mb-8">
            <div className="bg-blue-600 p-3 rounded-2xl shadow-lg inline-flex items-center justify-center mb-4">
              <Truck className="w-8 h-8 text-white animate-pulse" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white uppercase font-display">
              {configEmpresa.nombreEmpresa || "VIA LIMPIA SPA"}
            </h1>
            <p className="text-xs text-slate-400 font-semibold tracking-wider uppercase mt-1">
              Control de Reportes Operativos
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Usuario
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-slate-500" />
                <input 
                  type="text"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  placeholder="admin"
                  className="w-full pl-11 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-sm font-medium text-white transition-all placeholder:text-slate-600"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-slate-500" />
                <input 
                  type={showPassword ? "text" : "password"}
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-11 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-sm font-medium text-white transition-all placeholder:text-slate-600"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              </div>
            </div>

            {loginError && (
              <div className="p-3 bg-rose-950/50 border border-rose-900 text-rose-300 text-xs rounded-xl font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2 text-sm active:scale-[0.98] cursor-pointer"
            >
              <span>Iniciar Sesión</span>
            </button>
          </form>
        </div>

        {/* Floating Notifications System */}
        <AnimatePresence>
          {notificacion && (
            <motion.div 
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.95 }}
              className={`fixed bottom-6 right-6 z-50 flex items-center p-4 rounded-xl shadow-xl border ${
                notificacion.tipo === "success" ? "bg-emerald-950 border-emerald-900 text-emerald-100" :
                notificacion.tipo === "error" ? "bg-rose-950 border-rose-900 text-rose-100" :
                "bg-blue-950 border-blue-900 text-blue-100"
              }`}
            >
              <div className="mr-3">
                {notificacion.tipo === "success" && <CheckCircle className="w-5 h-5 text-emerald-400" />}
                {notificacion.tipo === "error" && <AlertCircle className="w-5 h-5 text-rose-400" />}
                {notificacion.tipo === "info" && <Info className="w-5 h-5 text-blue-400" />}
              </div>
              <div>
                <p className="font-semibold text-xs tracking-wide">{notificacion.mensaje}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] font-sans text-slate-800 antialiased w-full overflow-x-hidden">
      
      {/* 1. DESKTOP PERMANENT LEFT SIDEBAR */}
      <aside className="hidden lg:flex flex-col w-72 bg-slate-900 text-slate-100 border-r border-slate-800 shrink-0 select-none z-30">
        {/* Brand Header */}
        <div className="h-20 border-b border-slate-800 flex items-center px-6 gap-3.5">
          <div className="bg-blue-600 p-2 rounded-xl shadow-md shrink-0 flex items-center justify-center">
            <Truck className="w-5.5 h-5.5 text-white animate-pulse" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-bold tracking-tight text-white uppercase font-display leading-tight truncate">
              {configEmpresa.nombreEmpresa}
            </h1>
            <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase truncate">
              SISTEMA DE CONTROLES
            </p>
          </div>
        </div>

        {/* User Identity Info in sidebar */}
        <div className="p-4 mx-3 my-4 bg-slate-950/60 rounded-2xl border border-slate-800/80 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-inner">
            {usuarioActual?.nombre.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-slate-100 truncate capitalize">{usuarioActual?.nombre}</p>
            <span className="inline-block text-[9px] bg-slate-800 text-blue-400 font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider mt-0.5 border border-blue-950">
              {usuarioActual?.rol}
            </span>
          </div>
        </div>

        {/* Sidebar Nav links */}
        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 mb-2">Módulos</p>
          
          <button
            onClick={() => { setVistaActiva("servicios"); setMenuMovilAbierto(false); }}
            className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              vistaActiva === "servicios"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-950/50"
                : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/50"
            }`}
          >
            <Truck className="w-4.5 h-4.5" />
            <span>Servicios y Reportes</span>
          </button>

          <button
            onClick={() => { setVistaActiva("nomencladores"); setMenuMovilAbierto(false); }}
            className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              vistaActiva === "nomencladores"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-950/50"
                : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/50"
            }`}
          >
            <SlidersHorizontal className="w-4.5 h-4.5" />
            <span>Nomencladores (Catálogo)</span>
          </button>

          <button
            onClick={() => { setVistaActiva("usuarios"); setMenuMovilAbierto(false); }}
            className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              vistaActiva === "usuarios"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-950/50"
                : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/50"
            }`}
          >
            <Users className="w-4.5 h-4.5" />
            <span>Usuarios y Roles</span>
          </button>

          <button
            onClick={() => { setVistaActiva("configuracion"); setMenuMovilAbierto(false); }}
            className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              vistaActiva === "configuracion"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-950/50"
                : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/50"
            }`}
          >
            <Settings className="w-4.5 h-4.5" />
            <span>Configuración</span>
          </button>

          <div className="pt-6 border-t border-slate-800 my-4 space-y-2">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3">Herramientas BD</p>
            
            <button
              onClick={exportarBaseDatos}
              className="w-full flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-slate-100 hover:bg-slate-800/50 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4 text-blue-400" />
              <span>Respaldar Base Datos</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-slate-100 hover:bg-slate-800/50 transition-all cursor-pointer"
            >
              <Upload className="w-4 h-4 text-emerald-400" />
              <span>Cargar Base Datos</span>
            </button>
          </div>
        </nav>

        {/* Bottom profile actions */}
        <div className="p-4 border-t border-slate-800 space-y-2">
          <button
            onClick={iniciarEdicionPerfil}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors cursor-pointer text-left"
          >
            <User className="w-4 h-4 text-slate-500" />
            <span>Editar Mi Perfil</span>
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 transition-colors cursor-pointer text-left"
          >
            <LogOut className="w-4 h-4" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* 2. MOBILE RESPONSIVE NAV DRAWER / SIDEBAR (ANIMATED VIA ANIMPATE PRESENCE) */}
      <AnimatePresence>
        {menuMovilAbierto && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            {/* Overlay backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenuMovilAbierto(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            />

            {/* Sidebar content */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-80 max-w-xs bg-slate-900 text-slate-100 flex flex-col z-10 shadow-2xl"
            >
              {/* Mobile Sidebar Close Button */}
              <button
                onClick={() => setMenuMovilAbierto(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="h-20 border-b border-slate-800 flex items-center px-6 gap-3.5">
                <div className="bg-blue-600 p-2 rounded-xl shadow-md shrink-0 flex items-center justify-center">
                  <Truck className="w-5.5 h-5.5 text-white" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-lg font-bold tracking-tight text-white uppercase font-display leading-tight truncate">
                    {configEmpresa.nombreEmpresa}
                  </h1>
                  <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase truncate">
                    SISTEMA DE CONTROLES
                  </p>
                </div>
              </div>

              {/* User Identity Info in mobile sidebar */}
              <div className="p-4 mx-3 my-4 bg-slate-950/60 rounded-2xl border border-slate-800/80 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-inner">
                  {usuarioActual?.nombre.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-100 truncate capitalize">{usuarioActual?.nombre}</p>
                  <span className="inline-block text-[9px] bg-slate-800 text-blue-400 font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider mt-0.5 border border-blue-950">
                    {usuarioActual?.rol}
                  </span>
                </div>
              </div>

              {/* Mobile Sidebar nav links */}
              <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 mb-2">Módulos</p>
                
                <button
                  onClick={() => { setVistaActiva("servicios"); setMenuMovilAbierto(false); }}
                  className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    vistaActiva === "servicios"
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-950/50"
                      : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/50"
                  }`}
                >
                  <Truck className="w-4.5 h-4.5" />
                  <span>Servicios y Reportes</span>
                </button>

                <button
                  onClick={() => { setVistaActiva("nomencladores"); setMenuMovilAbierto(false); }}
                  className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    vistaActiva === "nomencladores"
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-950/50"
                      : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/50"
                  }`}
                >
                  <SlidersHorizontal className="w-4.5 h-4.5" />
                  <span>Nomencladores (Catálogo)</span>
                </button>

                <button
                  onClick={() => { setVistaActiva("usuarios"); setMenuMovilAbierto(false); }}
                  className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    vistaActiva === "usuarios"
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-950/50"
                      : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/50"
                  }`}
                >
                  <Users className="w-4.5 h-4.5" />
                  <span>Usuarios y Roles</span>
                </button>

                <button
                  onClick={() => { setVistaActiva("configuracion"); setMenuMovilAbierto(false); }}
                  className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    vistaActiva === "configuracion"
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-950/50"
                      : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/50"
                  }`}
                >
                  <Settings className="w-4.5 h-4.5" />
                  <span>Configuración</span>
                </button>

                <div className="pt-6 border-t border-slate-800 my-4 space-y-2">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3">Herramientas BD</p>
                  
                  <button
                    onClick={() => { exportarBaseDatos(); setMenuMovilAbierto(false); }}
                    className="w-full flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-slate-100 hover:bg-slate-800/50 transition-all cursor-pointer text-left"
                  >
                    <Download className="w-4 h-4 text-blue-400" />
                    <span>Respaldar Base Datos</span>
                  </button>

                  <button
                    onClick={() => { fileInputRef.current?.click(); setMenuMovilAbierto(false); }}
                    className="w-full flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-slate-100 hover:bg-slate-800/50 transition-all cursor-pointer text-left"
                  >
                    <Upload className="w-4 h-4 text-emerald-400" />
                    <span>Cargar Base Datos</span>
                  </button>
                </div>
              </nav>

              {/* Mobile Sidebar profile actions */}
              <div className="p-4 border-t border-slate-800 space-y-2">
                <button
                  onClick={() => { iniciarEdicionPerfil(); setMenuMovilAbierto(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors cursor-pointer text-left"
                >
                  <User className="w-4 h-4 text-slate-500" />
                  <span>Editar Mi Perfil</span>
                </button>
                <button
                  onClick={() => { handleLogout(); setMenuMovilAbierto(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 transition-colors cursor-pointer text-left"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. MAIN WORKSPACE CONTENT CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        
        {/* Responsive Header Bar */}
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-6 sm:px-8 shrink-0 sticky top-0 z-40 shadow-xs">
          <div className="flex items-center gap-4">
            {/* Mobile Hamburger toggle button */}
            <button
              onClick={() => setMenuMovilAbierto(true)}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
              title="Abrir menú de navegación"
            >
              <Menu className="w-6 h-6" />
            </button>

            <div className="flex items-center gap-3">
              <div className="hidden lg:flex bg-blue-50 text-blue-600 p-2 rounded-lg shadow-xs">
                {vistaActiva === "servicios" && <Truck className="w-5 h-5" />}
                {vistaActiva === "nomencladores" && <SlidersHorizontal className="w-5 h-5" />}
                {vistaActiva === "usuarios" && <Users className="w-5 h-5" />}
                {vistaActiva === "configuracion" && <Settings className="w-5 h-5" />}
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 uppercase font-display flex items-center gap-2">
                  <span>{configEmpresa.nombreEmpresa}</span>
                  <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded-full lowercase tracking-normal hidden sm:inline">v2.6</span>
                </h1>
                <p className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase">
                  {vistaActiva === "servicios" && "Servicios de camiones y reportes pdf"}
                  {vistaActiva === "nomencladores" && "Administración de catálogos y maestros"}
                  {vistaActiva === "usuarios" && "Gestión de cuentas de usuarios y roles"}
                  {vistaActiva === "configuracion" && "Ajustes de empresa y patente del vehículo"}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Profile Menu Header Widget for desktop */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end text-right">
              <span className="text-xs font-bold text-slate-800 truncate capitalize">{usuarioActual?.nombre}</span>
              <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">{usuarioActual?.rol}</span>
            </div>

            <div className="relative">
              <button
                onClick={() => setMostrarMenuPerfil(prev => !prev)}
                className="bg-slate-900 hover:bg-slate-800 text-white p-1 rounded-full sm:px-3.5 sm:py-2 sm:rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer text-left"
                title="Menú de Perfil"
              >
                <div className="w-7 h-7 rounded-full bg-blue-500 text-white font-bold text-xs flex items-center justify-center shadow-inner">
                  {usuarioActual?.nombre.charAt(0).toUpperCase()}
                </div>
                <span className="hidden sm:inline max-w-[120px] truncate capitalize">{usuarioActual?.nombre.split(" ")[0]}</span>
              </button>
              
              <AnimatePresence>
                {mostrarMenuPerfil && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setMostrarMenuPerfil(false)} 
                    />
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 mt-2.5 w-60 bg-white border border-slate-100 rounded-2xl shadow-xl p-3 z-50 text-slate-800"
                    >
                      <div className="p-2 border-b border-slate-50 text-xs">
                        <p className="font-extrabold text-slate-900 truncate capitalize">{usuarioActual?.nombre}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5 font-semibold">Usuario: <span className="font-bold">{usuarioActual?.usuario}</span></p>
                      </div>
                      <div className="py-1.5 space-y-0.5">
                        <button 
                          onClick={() => { setEditandoPerfil(true); setMostrarMenuPerfil(false); }}
                          className="w-full text-left px-3 py-2 text-xs font-semibold hover:bg-slate-50 rounded-xl transition-colors cursor-pointer flex items-center gap-2 text-slate-700"
                        >
                          <User className="w-4 h-4 text-slate-400" />
                          <span>Editar Mi Perfil</span>
                        </button>
                        <button 
                          onClick={handleLogout}
                          className="w-full text-left px-3 py-2 text-xs font-semibold hover:bg-rose-50 text-rose-600 rounded-xl transition-colors cursor-pointer flex items-center gap-2"
                        >
                          <LogOut className="w-4 h-4 text-rose-400" />
                          <span>Cerrar Sesión</span>
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Hidden inputs / references */}
        <input 
          type="file"
          ref={fileInputRef}
          onChange={importarBaseDatos}
          accept=".json"
          className="hidden"
        />

        {/* Floating Notifications System */}
        <AnimatePresence>
          {notificacion && (
            <motion.div 
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.95 }}
              className={`fixed bottom-6 right-6 z-50 flex items-center p-4 rounded-xl shadow-xl border ${
                notificacion.tipo === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-900" :
                notificacion.tipo === "error" ? "bg-rose-50 border-rose-200 text-rose-900" :
                "bg-blue-50 border-blue-200 text-blue-900"
              }`}
            >
              <div className="mr-3">
                {notificacion.tipo === "success" && <CheckCircle className="w-5 h-5 text-emerald-600" />}
                {notificacion.tipo === "error" && <AlertCircle className="w-5 h-5 text-rose-600" />}
                {notificacion.tipo === "info" && <Info className="w-5 h-5 text-blue-600" />}
              </div>
              <div>
                <p className="font-semibold text-xs tracking-wide">{notificacion.mensaje}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 4. MAIN WORKSPACE PANELS */}
        <main className="flex-1 p-6 sm:p-8 space-y-8 overflow-y-auto">

          {/* ASYNCHRONOUS SECURE OVERLAY INTERFACE */}
          <AnimatePresence>
            {asyncOperando && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-slate-950/70 z-50 flex flex-col items-center justify-center p-4 backdrop-blur-xs text-white"
              >
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-sm w-full text-center space-y-4 shadow-2xl flex flex-col items-center">
                  <div className="relative flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full border-4 border-slate-700 border-t-blue-500 animate-spin" />
                    <Lock className="w-4 h-4 text-blue-500 absolute animate-pulse" />
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-xs text-blue-400 font-bold uppercase tracking-wider">Transacción Asíncrona Segura</p>
                    <p className="text-sm font-semibold text-slate-100">{asyncMensaje}</p>
                    <p className="text-[10px] text-slate-500 font-medium">Sincronizando almacenamiento local...</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Conditional Multi-View Routing */}
          {vistaActiva === "usuarios" ? (
          /* ==================== GESTIÓN DE USUARIOS ==================== */
          <div className="space-y-8">
            {/* Header / Intro section */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-wider mb-2">
                  <Shield className="w-4 h-4" />
                  <span>Seguridad y Accesos</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 uppercase font-display">
                  Gestión de Usuarios y Roles
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                  Administra las credenciales del personal de transporte y configura sus niveles de acceso al sistema.
                </p>
              </div>

              {/* Roles Summary Badges */}
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-xl font-bold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  Administradores ({usuarios.filter(u => u.rol === "Administrador").length})
                </span>
                <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl font-bold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Operadores ({usuarios.filter(u => u.rol === "Operador").length})
                </span>
                <span className="px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-100 rounded-xl font-bold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  Conductores ({usuarios.filter(u => u.rol === "Conductor").length})
                </span>
              </div>
            </div>

            {/* Main grid: User list on left, Add Form on right */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* User List Panel (8/12 width) */}
              <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-slate-800 uppercase tracking-wide text-sm flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-600" />
                      Cuentas Registradas
                    </h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">Listado de personal autorizado</p>
                  </div>
                  <span className="text-[11px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-full uppercase">
                    Total: {usuarios.length}
                  </span>
                </div>

                <div className="divide-y divide-slate-100 overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/20 text-slate-400 text-[10px] font-bold uppercase tracking-wider border-b border-slate-100">
                        <th className="px-6 py-4">Personal / Nombre</th>
                        <th className="px-6 py-4">Usuario</th>
                        <th className="px-6 py-4">Contraseña</th>
                        <th className="px-6 py-4">Rol Asignado</th>
                        <th className="px-6 py-4 text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {usuarios.map(user => {
                        const esAdminDefault = user.id === "admin-default";
                        const esYo = usuarioActual?.id === user.id;
                        const esAdminActivo = usuarioActual?.rol === "Administrador";

                        return (
                          <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                                  user.rol === "Administrador" ? "bg-blue-100 text-blue-700" :
                                  user.rol === "Operador" ? "bg-emerald-100 text-emerald-700" :
                                  "bg-amber-100 text-amber-700"
                                } shadow-xs`}>
                                  {user.nombre.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <span className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                                    {user.nombre}
                                    {esYo && (
                                      <span className="text-[9px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-md font-bold uppercase">
                                        Tú
                                      </span>
                                    )}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-xs font-mono text-slate-600 bg-slate-100 px-2 py-1 rounded-md border border-slate-200">
                                {user.usuario}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-xs font-mono text-slate-400 select-all tracking-wider font-semibold">
                                {user.contrasena}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                user.rol === "Administrador" ? "bg-blue-50 text-blue-700 border border-blue-200" :
                                user.rol === "Operador" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                                "bg-amber-50 text-amber-700 border border-amber-200"
                              } border`}>
                                {user.rol}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center whitespace-nowrap">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => setUsuarioEditando(user)}
                                  disabled={!esAdminActivo && !esYo}
                                  className={`p-1.5 rounded-lg transition-all ${
                                    esAdminActivo || esYo 
                                      ? "text-slate-500 hover:text-blue-600 hover:bg-blue-50 cursor-pointer" 
                                      : "text-slate-300 cursor-not-allowed"
                                  }`}
                                  title={esAdminActivo || esYo ? "Editar datos de usuario" : "No tienes permisos para editar este usuario"}
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleEliminarUsuario(user.id)}
                                  disabled={!esAdminActivo || esAdminDefault || esYo}
                                  className={`p-1.5 rounded-lg transition-all ${
                                    esAdminActivo && !esAdminDefault && !esYo
                                      ? "text-slate-500 hover:text-rose-600 hover:bg-rose-50 cursor-pointer" 
                                      : "text-slate-300 cursor-not-allowed"
                                  }`}
                                  title={
                                    esAdminDefault ? "El administrador por defecto no se puede borrar" :
                                    esYo ? "No puedes borrarte a ti mismo" :
                                    esAdminActivo ? "Eliminar usuario" : "Solo administradores pueden eliminar usuarios"
                                  }
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Create User panel (4/12 width) */}
              <div className="lg:col-span-4">
                {usuarioActual?.rol === "Administrador" ? (
                  <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
                    <div className="flex items-center space-x-2.5 mb-6 border-b border-slate-100 pb-4">
                      <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                        <UserPlus className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 uppercase tracking-wide text-sm">Nuevo Usuario</h3>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">Asigna rol y contraseña</p>
                      </div>
                    </div>

                    <form onSubmit={handleCrearUsuario} className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                          Nombre Completo *
                        </label>
                        <input 
                          type="text"
                          value={nuevoNombre}
                          onChange={(e) => setNuevoNombre(e.target.value)}
                          placeholder="Ej: Carlos Silva"
                          className="w-full px-4 py-2.5 border border-slate-200 bg-slate-50 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm font-semibold transition-all"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                          Usuario de Ingreso *
                        </label>
                        <input 
                          type="text"
                          value={nuevoUsuario}
                          onChange={(e) => setNuevoUsuario(e.target.value)}
                          placeholder="Ej: csilva"
                          className="w-full px-4 py-2.5 border border-slate-200 bg-slate-50 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm font-semibold transition-all"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                          Contraseña de Acceso *
                        </label>
                        <input 
                          type="text"
                          value={nuevaContrasena}
                          onChange={(e) => setNuevaContrasena(e.target.value)}
                          placeholder="Ej: clave123"
                          className="w-full px-4 py-2.5 border border-slate-200 bg-slate-50 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm font-semibold transition-all"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                          Rol en el Sistema *
                        </label>
                        <select
                          value={nuevoRol}
                          onChange={(e) => setNuevoRol(e.target.value as any)}
                          className="w-full px-4 py-2.5 border border-slate-200 bg-slate-50 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm font-bold text-slate-700 transition-all cursor-pointer"
                        >
                          <option value="Administrador">Administrador</option>
                          <option value="Operador">Operador (Ingresos y Reportes)</option>
                          <option value="Conductor">Conductor (Lectura o Rutas)</option>
                        </select>
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-xs hover:shadow-md transition-all flex items-center justify-center space-x-2 text-xs active:scale-[0.98] cursor-pointer"
                      >
                        <UserPlus className="w-4 h-4" />
                        <span>Crear Cuenta de Usuario</span>
                      </button>
                    </form>
                  </div>
                ) : (
                  <div className="bg-slate-100 border border-slate-200 rounded-3xl p-6 text-center space-y-4">
                    <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center mx-auto text-slate-400">
                      <Lock className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm uppercase">Registro Bloqueado</h4>
                      <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                        Solo los usuarios con el rol de <strong>Administrador</strong> pueden dar de alta nuevas cuentas o modificar los roles asignados en el sistema.
                      </p>
                    </div>
                    <div className="p-3 bg-blue-50 border border-blue-100 text-blue-700 rounded-xl text-xs font-semibold">
                      Rol de tu cuenta: <span className="uppercase">{usuarioActual?.rol}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : vistaActiva === "nomencladores" ? (
          /* ==================== MÓDULO NOMENCLADORES ==================== */
          <div className="space-y-8">
            {/* Header / Intro section */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-wider mb-2">
                  <SlidersHorizontal className="w-4 h-4" />
                  <span>Maestros y Nomencladores</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 uppercase font-display">
                  Administración de Catálogos Reutilizables
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                  Crea, edita y remueve los datos reutilizables del sistema para evitar errores de escritura manual en los formularios.
                </p>
              </div>
              
              {/* Database Quick Info / Status */}
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="px-3 py-1.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-xl font-bold flex items-center gap-1.5">
                  📁 Conductores ({catConductores.length})
                </span>
                <span className="px-3 py-1.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-xl font-bold flex items-center gap-1.5">
                  🏢 Clientes ({catClientes.length})
                </span>
                <span className="px-3 py-1.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-xl font-bold flex items-center gap-1.5">
                  📍 Regiones ({catRegiones.length})
                </span>
              </div>
            </div>

            {/* Layout with selector tab bar and side form / table */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Left Column: List/Table of active catalog */}
              <div className="lg:col-span-8 space-y-6">
                
                {/* Entity selection tabs */}
                <div className="bg-white p-2.5 rounded-2xl border border-slate-200 flex flex-wrap gap-1.5">
                  <button
                    onClick={() => { setTabActivoNomenclador("conductores"); setEditandoNomencladorId(null); setNuevoNomencladorNombre(""); }}
                    className={`flex-1 min-w-[120px] px-4 py-3 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      tabActivoNomenclador === "conductores"
                        ? "bg-blue-600 text-white shadow-md shadow-blue-100"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    <User className="w-4 h-4" />
                    <span>Conductores ({catConductores.length})</span>
                  </button>

                  <button
                    onClick={() => { setTabActivoNomenclador("clientes"); setEditandoNomencladorId(null); setNuevoNomencladorNombre(""); }}
                    className={`flex-1 min-w-[120px] px-4 py-3 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      tabActivoNomenclador === "clientes"
                        ? "bg-blue-600 text-white shadow-md shadow-blue-100"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    <Building2 className="w-4 h-4" />
                    <span>Clientes ({catClientes.length})</span>
                  </button>

                  <button
                    onClick={() => { setTabActivoNomenclador("regiones"); setEditandoNomencladorId(null); setNuevoNomencladorNombre(""); }}
                    className={`flex-1 min-w-[120px] px-4 py-3 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      tabActivoNomenclador === "regiones"
                        ? "bg-blue-600 text-white shadow-md shadow-blue-100"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    <MapPin className="w-4 h-4" />
                    <span>Regiones/Comunas ({catRegiones.length})</span>
                  </button>
                </div>

                {/* Table card */}
                <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
                  <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center flex-wrap gap-4">
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wide flex items-center gap-2">
                        <span>Elementos en Catálogo:</span>
                        <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full capitalize">{tabActivoNomenclador}</span>
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">Lista actual de datos cargados en la base de datos de persistencia local.</p>
                    </div>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {/* Render corresponding items based on active tab */}
                    {((tabActivoNomenclador === "conductores" ? catConductores :
                       tabActivoNomenclador === "clientes" ? catClientes :
                       catRegiones) || []).length === 0 ? (
                      <div className="p-12 text-center text-slate-400">
                        <p className="text-xs font-bold uppercase tracking-wider">No hay elementos registrados en este catálogo</p>
                        <p className="text-xs text-slate-400 mt-1">Usa el formulario de la derecha para dar de alta el primer elemento.</p>
                      </div>
                    ) : (
                      ((tabActivoNomenclador === "conductores" ? catConductores :
                        tabActivoNomenclador === "clientes" ? catClientes :
                        catRegiones) || []).map((item, idx) => (
                        <div key={item.id} className="p-4 sm:p-5 flex items-center justify-between hover:bg-slate-50/80 transition-colors">
                          <div className="flex items-center gap-3.5 min-w-0">
                            <span className="text-[10px] text-slate-400 font-mono font-bold w-6">{idx + 1}.</span>
                            <div className="bg-slate-100 text-slate-700 p-2 rounded-xl">
                              {tabActivoNomenclador === "conductores" && <User className="w-4 h-4 text-blue-600" />}
                              {tabActivoNomenclador === "clientes" && <Building2 className="w-4 h-4 text-indigo-600" />}
                              {tabActivoNomenclador === "regiones" && <MapPin className="w-4 h-4 text-emerald-600" />}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-slate-800 text-sm truncate">{item.nombre}</p>
                              <p className="text-[9px] text-slate-400 font-mono tracking-wider uppercase mt-0.5">ID: {item.id}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => handleIniciarEditarNomenclador(item)}
                              className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all cursor-pointer"
                              title="Editar nombre del elemento"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleEliminarElementoNomenclador(item.id, item.nombre)}
                              className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                              title="Eliminar elemento del catálogo"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Add / Edit Form */}
              <div className="lg:col-span-4 space-y-6">
                
                <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wide flex items-center gap-2">
                      {editandoNomencladorId ? (
                        <>
                          <Pencil className="w-4 h-4 text-blue-600" />
                          <span>Modificar Elemento</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 text-blue-600" />
                          <span>Agregar al Catálogo</span>
                        </>
                      )}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      {editandoNomencladorId
                        ? "Actualiza el valor en todos los menús desplegables del sistema."
                        : "Da de alta un nuevo elemento disponible para autocompletado rápido."}
                    </p>
                  </div>

                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (editandoNomencladorId) {
                        handleGuardarEditarNomenclador(e);
                      } else {
                        handleCrearElementoNomenclador(e);
                      }
                    }}
                    className="space-y-4"
                  >
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                        Categoría Seleccionada
                      </label>
                      <input
                        type="text"
                        value={tabActivoNomenclador === "conductores" ? "Conductor Asignado" :
                               tabActivoNomenclador === "clientes" ? "Razón Social / Cliente" : "Región / Comuna"}
                        disabled
                        className="w-full px-4 py-2.5 border border-slate-100 bg-slate-50/80 rounded-xl text-xs font-extrabold text-slate-500 uppercase tracking-wider select-none cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                        Nombre del Elemento *
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={editandoNomencladorId ? editandoNomencladorNombre : nuevoNomencladorNombre}
                          onChange={(e) => {
                            if (editandoNomencladorId) {
                              setEditandoNomencladorNombre(e.target.value);
                            } else {
                              setNuevoNomencladorNombre(e.target.value);
                            }
                          }}
                          placeholder={
                            tabActivoNomenclador === "conductores" ? "Nombre del conductor asignado" :
                            tabActivoNomenclador === "clientes" ? "Razón social del cliente" :
                            "Ej: Región de Antofagasta / Sierra Gorda"
                          }
                          className="w-full px-4 py-2.5 border border-slate-200 bg-slate-50 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm font-semibold transition-all"
                          required
                        />
                      </div>
                    </div>

                    <div className="pt-2 flex gap-2">
                      {editandoNomencladorId && (
                        <button
                          type="button"
                          onClick={() => { setEditandoNomencladorId(null); setEditandoNomencladorNombre(""); }}
                          className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl text-xs transition-all cursor-pointer"
                        >
                          Cancelar
                        </button>
                      )}
                      <button
                        type="submit"
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl text-xs shadow-xs hover:shadow-md transition-all active:scale-95 cursor-pointer"
                      >
                        {editandoNomencladorId ? "Guardar Cambios" : "Agregar Elemento"}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Secure Catalog Tip Card */}
                <div className="bg-blue-950 text-blue-100 p-5 rounded-3xl space-y-2 border border-blue-900/40">
                  <h4 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 text-blue-300">
                    <Shield className="w-4 h-4" />
                    <span>Control de Acceso</span>
                  </h4>
                  <p className="text-[11px] leading-relaxed opacity-90">
                    Las modificaciones del catálogo de nomencladores son asincrónicas y seguras. Requieren que tu cuenta posea permisos de nivel <strong>Administrador</strong> u <strong>Operador</strong>.
                  </p>
                </div>

              </div>

            </div>
          </div>
        ) : vistaActiva === "configuracion" ? (
          /* ==================== MÓDULO CONFIGURACIÓN ==================== */
          <div className="space-y-8 max-w-4xl">
            {/* Header / Intro section */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-wider mb-2">
                  <Settings className="w-4 h-4" />
                  <span>Ajustes Generales de Flota</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 uppercase font-display">
                  Configuración de Empresa y Vehículo
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                  Personaliza la razón social de la empresa y la patente del camión principal. Estos datos actualizan automáticamente los encabezados de reportes PDF y menús.
                </p>
              </div>
            </div>

            {/* Form Card */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="font-bold text-slate-900 text-base uppercase font-display flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  <span>Datos Identificatorios de Flota</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Ingresa el nombre corporativo y la patente del camión que deben figurar en la documentación oficial.
                </p>
              </div>

              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  ejecutarOperacionAsincrona("Guardando configuración...", () => {
                    triggerNotificacion("Configuración de empresa y patente guardada correctamente.");
                  });
                }} 
                className="space-y-6"
              >
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Nombre / Razón Social de la Empresa *
                  </label>
                  <input
                    type="text"
                    value={configEmpresa.nombreEmpresa}
                    onChange={(e) => setConfigEmpresa(prev => ({ ...prev, nombreEmpresa: e.target.value }))}
                    placeholder="Ej: Via Limpia"
                    className="w-full px-4 py-3 border border-slate-200 bg-slate-50 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm font-bold text-slate-800 transition-all"
                    required
                  />
                  <p className="text-[11px] text-slate-400 mt-1.5">
                    Aparecerá en la barra superior de la app y en el título del encabezado del reporte operativo en PDF.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Patente / Matrícula del Vehículo *
                  </label>
                  <input
                    type="text"
                    value={configEmpresa.patenteVehiculo}
                    onChange={(e) => setConfigEmpresa(prev => ({ ...prev, patenteVehiculo: e.target.value.toUpperCase() }))}
                    placeholder="Ej: TFTB63"
                    className="w-full px-4 py-3 border border-slate-200 bg-slate-50 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm font-extrabold font-mono text-slate-800 uppercase tracking-wider transition-all"
                    required
                  />
                  <p className="text-[11px] text-slate-400 mt-1.5">
                    Identificación principal del camión para los controles y reportes consolidados.
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-xs text-slate-500 font-semibold flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Guardado local inmediato sincronizado con respaldos JSON.</span>
                  </div>
                  <button
                    type="submit"
                    className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-full shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wider cursor-pointer active:scale-95"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Guardar Configuración</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : (
          <>
            {/* Sleek Summary bento grid row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 shrink-0">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">Viajes Registrados</p>
            <p className="text-3xl font-bold text-slate-900 font-display">{servicios.length}</p>
            <p className="text-xs text-emerald-600 font-semibold mt-2 flex items-center gap-1">
              <span>●</span> Historial Activo de Flota
            </p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">Peso Total Despachado</p>
            <p className="text-3xl font-bold text-slate-900 font-display">{formatearPeso(totalPeso.toString())}</p>
            <p className="text-xs text-slate-400 mt-2 italic font-medium">Acumulado certificado en kg</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">Conductores Activos</p>
            <p className="text-3xl font-bold text-slate-900 font-display">{listaConductores.length - 1}</p>
            <p className="text-xs text-blue-600 font-semibold mt-2 flex items-center gap-1">
              <span>👥</span> {listaConductores.length - 1} en ruta asignada
            </p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">Certificaciones SIDREP</p>
            <p className="text-3xl font-bold text-slate-900 font-display">
              {servicios.filter(s => s.numSidrep !== "N/A").length}
            </p>
            <p className="text-xs text-amber-500 font-semibold mt-2 flex items-center gap-1">
              <span>🛡️</span> Residuos Ecológicos Regulados
            </p>
          </div>
        </div>
        
        {/* Forms layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Column Left (8/12 width): Service Registry Form */}
          <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
            <div className="flex items-center space-x-2.5 mb-6 border-b border-slate-100 pb-4">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 uppercase tracking-wide">Registrar Nuevo Servicio</h2>
                <p className="text-xs text-slate-500">Ingreso de trayectos, guías y documentos operacionales</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Row 1: Date, Service ID, Matrícula/Patente, Conductor */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Fecha del Servicio *
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input 
                      type="date"
                      name="fecha"
                      value={formData.fecha}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-3 py-2.5 border border-slate-200 bg-slate-50 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-sm font-medium transition-all"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Número de Servicio *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-sm font-bold text-slate-400">#</span>
                    <input 
                      type="text"
                      name="numServicio"
                      value={formData.numServicio}
                      onChange={handleInputChange}
                      placeholder="Ej: 1250"
                      className="w-full pl-8 pr-3 py-2.5 border border-slate-200 bg-slate-50 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-sm font-bold transition-all placeholder:font-normal"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Matrícula / Patente *
                  </label>
                  <div className="relative">
                    <Truck className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input 
                      type="text"
                      name="patente"
                      value={formData.patente}
                      onChange={(e) => setFormData(prev => ({ ...prev, patente: e.target.value.toUpperCase() }))}
                      placeholder="Ej: TFTB63"
                      className="w-full pl-10 pr-3 py-2.5 border border-slate-200 bg-slate-50 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-sm font-bold font-mono tracking-wider uppercase transition-all"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span>Conductor Asignado *</span>
                    <button
                      type="button"
                      onClick={() => setInputModeConductor(prev => prev === "select" ? "custom" : "select")}
                      className="text-[10px] text-blue-600 hover:underline font-bold"
                    >
                      {inputModeConductor === "select" ? "✏️ Escribir manual" : "📋 Elegir del catálogo"}
                    </button>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    {inputModeConductor === "select" ? (
                      <select
                        name="conductor"
                        value={formData.conductor}
                        onChange={(e) => {
                          if (e.target.value === "__MANAGE__") {
                            setVistaActiva("nomencladores");
                            setTabActivoNomenclador("conductores");
                            triggerNotificacion("Abriendo administración de conductores...", "info");
                          } else {
                            setFormData(prev => ({ ...prev, conductor: e.target.value }));
                          }
                        }}
                        className="w-full pl-10 pr-3 py-2.5 border border-slate-200 bg-slate-50 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-sm font-semibold transition-all appearance-none cursor-pointer"
                        required
                      >
                        <option value="">-- Seleccione Conductor --</option>
                        {catConductores.map(c => (
                          <option key={c.id} value={c.nombre}>{c.nombre}</option>
                        ))}
                        <option value="__MANAGE__" className="text-blue-600 font-bold">⚙️ Administrar Catálogo...</option>
                      </select>
                    ) : (
                      <input 
                        type="text"
                        name="conductor"
                        value={formData.conductor}
                        onChange={handleInputChange}
                        placeholder="Escriba nombre del conductor"
                        className="w-full pl-10 pr-3 py-2.5 border border-slate-200 bg-slate-50 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-sm font-semibold transition-all"
                        required
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Row 2: Client, Region/Commune and Description */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span>Razón Social / Cliente *</span>
                    <button
                      type="button"
                      onClick={() => setInputModeCliente(prev => prev === "select" ? "custom" : "select")}
                      className="text-[10px] text-blue-600 hover:underline font-bold"
                    >
                      {inputModeCliente === "select" ? "✏️ Escribir manual" : "📋 Elegir del catálogo"}
                    </button>
                  </label>
                  {inputModeCliente === "select" ? (
                    <select
                      name="razonSocial"
                      value={formData.razonSocial}
                      onChange={(e) => {
                        if (e.target.value === "__MANAGE__") {
                          setVistaActiva("nomencladores");
                          setTabActivoNomenclador("clientes");
                          triggerNotificacion("Abriendo administración de clientes...", "info");
                        } else {
                          setFormData(prev => ({ ...prev, razonSocial: e.target.value }));
                        }
                      }}
                      className="w-full px-4 py-2.5 border border-slate-200 bg-slate-50 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-sm font-semibold transition-all appearance-none cursor-pointer"
                      required
                    >
                      <option value="">-- Seleccione Cliente --</option>
                      {catClientes.map(c => (
                        <option key={c.id} value={c.nombre}>{c.nombre}</option>
                      ))}
                      <option value="__MANAGE__" className="text-blue-600 font-bold">⚙️ Administrar Catálogo...</option>
                    </select>
                  ) : (
                    <input 
                      type="text"
                      name="razonSocial"
                      value={formData.razonSocial}
                      onChange={handleInputChange}
                      placeholder="Ej: Minera del Norte S.A."
                      className="w-full px-4 py-2.5 border border-slate-200 bg-slate-50 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-sm font-semibold transition-all"
                      required
                    />
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span>Región / Comuna *</span>
                    <button
                      type="button"
                      onClick={() => setInputModeRegion(prev => prev === "select" ? "custom" : "select")}
                      className="text-[10px] text-blue-600 hover:underline font-bold"
                    >
                      {inputModeRegion === "select" ? "✏️ Escribir manual" : "📋 Elegir del catálogo"}
                    </button>
                  </label>
                  {inputModeRegion === "select" ? (
                    <select
                      name="regionComuna"
                      value={formData.regionComuna}
                      onChange={(e) => {
                        if (e.target.value === "__MANAGE__") {
                          setVistaActiva("nomencladores");
                          setTabActivoNomenclador("regiones");
                          triggerNotificacion("Abriendo administración de regiones...", "info");
                        } else {
                          setFormData(prev => ({ ...prev, regionComuna: e.target.value }));
                        }
                      }}
                      className="w-full px-4 py-2.5 border border-slate-200 bg-slate-50 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-sm font-semibold transition-all appearance-none cursor-pointer"
                      required
                    >
                      <option value="">-- Seleccione Región / Comuna --</option>
                      {catRegiones.map(r => (
                        <option key={r.id} value={r.nombre}>{r.nombre}</option>
                      ))}
                      <option value="__MANAGE__" className="text-blue-600 font-bold">⚙️ Administrar Catálogo...</option>
                    </select>
                  ) : (
                    <input 
                      type="text"
                      name="regionComuna"
                      value={formData.regionComuna}
                      onChange={handleInputChange}
                      placeholder="Ej: Antofagasta / Sierra Gorda"
                      className="w-full px-4 py-2.5 border border-slate-200 bg-slate-50 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-sm font-semibold transition-all"
                      required
                    />
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Servicio Realizado *
                  </label>
                  <input 
                    type="text"
                    name="servicioRealizado"
                    value={formData.servicioRealizado}
                    onChange={handleInputChange}
                    placeholder="Ej: Traslado de concentrado de cobre y retiro de residuos"
                    className="w-full px-4 py-2.5 border border-slate-200 bg-slate-50 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-sm font-semibold transition-all"
                    required
                  />
                </div>
              </div>

              {/* Row 3: SIDREP & Peso & Dispatch Guide */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span>Número SIDREP</span>
                    <span className="text-[10px] text-amber-600 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">Si aplica</span>
                  </label>
                  <input 
                    type="text"
                    name="numSidrep"
                    value={formData.numSidrep}
                    onChange={handleInputChange}
                    placeholder="Ej: SD-44510"
                    className="w-full px-4 py-2.5 border border-slate-200 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm font-medium transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span>Peso Est. SIDREP (kg)</span>
                    <span className="text-[10px] text-slate-400 font-normal">Requerido SIDREP</span>
                  </label>
                  <input 
                    type="number"
                    name="pesoEstimado"
                    value={formData.pesoEstimado}
                    onChange={handleInputChange}
                    disabled={!formData.numSidrep.trim()}
                    placeholder={formData.numSidrep.trim() ? "Ej: 4500" : "Habilite con SIDREP"}
                    className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm font-semibold transition-all ${
                      !formData.numSidrep.trim() 
                        ? "bg-slate-200 text-slate-400 cursor-not-allowed border-slate-200" 
                        : "bg-white border-slate-200"
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span>N° Guía Despacho</span>
                    <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">Despacho</span>
                  </label>
                  <input 
                    type="text"
                    name="numGuia"
                    value={formData.numGuia}
                    onChange={handleInputChange}
                    placeholder="Ej: GD-778901"
                    className="w-full px-4 py-2.5 border border-slate-200 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm font-medium transition-all"
                  />
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-2 flex justify-end">
                <button 
                  type="submit"
                  className="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-6 py-2.5 rounded-full shadow-xs hover:shadow-md transition-all flex items-center space-x-2 text-sm active:scale-95 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Ingresar Registro de Servicio</span>
                </button>
              </div>

            </form>
          </div>

          {/* Column Right (4/12 width): Elegant PDF Export Panel */}
          <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center space-x-2.5 mb-4 border-b border-slate-100 pb-4">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <FileDown className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 uppercase tracking-wide">Emisión de Reporte</h2>
                  <p className="text-xs text-slate-500">Formato Carta para Impresión</p>
                </div>
              </div>
              
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-5">
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Genera un PDF oficial con membrete <strong className="text-blue-600">Via Limpia TFTB63</strong>. 
                  Los datos se ordenan cronológicamente y se dividen en tablas para evitar cortes ilegibles al imprimir.
                </p>
              </div>

              {/* Form parameters */}
              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Filtro Temporal de Emisión
                  </label>
                  <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setReporteTipo("dia")}
                      className={`py-2 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                        reporteTipo === "dia" ? "bg-white text-blue-600 shadow-xs" : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      Día único
                    </button>
                    <button
                      type="button"
                      onClick={() => setReporteTipo("rango")}
                      className={`py-2 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                        reporteTipo === "rango" ? "bg-white text-blue-600 shadow-xs" : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      Rango
                    </button>
                    <button
                      type="button"
                      onClick={() => setReporteTipo("mes")}
                      className={`py-2 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                        reporteTipo === "mes" ? "bg-white text-blue-600 shadow-xs" : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      Mensual
                    </button>
                  </div>
                </div>

                {/* Conditional Parameter Inputs */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 min-h-[110px] flex items-center justify-center">
                  {reporteTipo === "dia" && (
                    <div className="w-full">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Día Solicitado</label>
                      <input 
                        type="date"
                        value={reporteFechaDia}
                        onChange={(e) => setReporteFechaDia(e.target.value)}
                        className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold"
                      />
                    </div>
                  )}

                  {reporteTipo === "rango" && (
                    <div className="w-full space-y-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">Fecha Inicio</label>
                        <input 
                          type="date"
                          value={reporteFechaInicio}
                          onChange={(e) => setReporteFechaInicio(e.target.value)}
                          className="w-full px-3.5 py-1.5 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">Fecha Término</label>
                        <input 
                          type="date"
                          value={reporteFechaFin}
                          onChange={(e) => setReporteFechaFin(e.target.value)}
                          className="w-full px-3.5 py-1.5 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none"
                        />
                      </div>
                    </div>
                  )}

                  {reporteTipo === "mes" && (
                    <div className="w-full">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Mes y Año de Emisión</label>
                      <input 
                        type="month"
                        value={reporteMes}
                        onChange={(e) => setReporteMes(e.target.value)}
                        className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none font-semibold"
                      />
                    </div>
                  )}
                </div>

                {/* Matrícula/Patente Filter for Report */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Filtrar por Servicio
                    </label>
                    <select
                      value={reporteServicio}
                      onChange={(e) => setReporteServicio(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer"
                    >
                      {listaServiciosUnicos.map((serv, i) => (
                        <option key={i} value={serv}>
                          {serv === "Todos" ? "Todos los Servicios" : serv}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Filtrar por Matrícula
                    </label>
                    <select
                      value={reportePatente}
                      onChange={(e) => setReportePatente(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer uppercase font-mono"
                    >
                      {listaPatentes.map((pat, i) => (
                        <option key={i} value={pat}>
                          {pat === "Todos" ? "Todas" : pat}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={descargarReportePDF}
              className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-full shadow-xs hover:shadow-md transition-all flex items-center justify-center space-x-2 text-sm active:scale-95 cursor-pointer"
            >
              <FileCheck className="w-4.5 h-4.5" />
              <span>Imprimir / Descargar Reporte</span>
            </button>
          </div>

        </div>

        {/* Database Table view (Sleek Interface Style) */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          
          <div className="px-8 py-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
            <div>
              <h2 className="font-bold text-slate-800 uppercase tracking-wide text-sm">Detalle de Rutas y Conductores</h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Visualización del historial completo en memoria local</p>
            </div>

            {/* Live Filter Controls */}
            <div className="flex flex-wrap items-center gap-2.5">
              
              {/* Keyword Search */}
              <div className="relative">
                <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
                <input 
                  type="text"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar matrícula, conductor, cliente..."
                  className="pl-9 pr-4 py-2 border border-slate-200 bg-white rounded-xl text-xs w-full focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium shadow-xs"
                />
              </div>

              {/* Matrícula/Patente Filter Dropdown */}
              <div className="flex items-center space-x-1.5 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Matrícula:</span>
                <select
                  value={filtroPatente}
                  onChange={(e) => setFiltroPatente(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-700 focus:outline-none pr-1 cursor-pointer font-mono uppercase"
                >
                  {listaPatentes.map((pat, i) => (
                    <option key={i} value={pat}>{pat}</option>
                  ))}
                </select>
              </div>

              {/* Conductor Filter Dropdown */}
              <div className="flex items-center space-x-1.5 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Conductor:</span>
                <select
                  value={filtroConductor}
                  onChange={(e) => setFiltroConductor(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-700 focus:outline-none pr-1 cursor-pointer"
                >
                  {listaConductores.map((cond, i) => (
                    <option key={i} value={cond}>{cond}</option>
                  ))}
                </select>
              </div>

              {/* Servicio Filter Dropdown */}
              <div className="flex items-center space-x-1.5 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Servicio:</span>
                <select
                  value={filtroServicio}
                  onChange={(e) => setFiltroServicio(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-700 focus:outline-none pr-1 cursor-pointer max-w-[140px] truncate"
                >
                  {listaServiciosUnicos.map((serv, i) => (
                    <option key={i} value={serv}>
                      {serv === "Todos" ? "Todos los Servicios" : serv}
                    </option>
                  ))}
                </select>
              </div>

            </div>
          </div>

          {/* Table display */}
          {serviciosFiltrados.length === 0 ? (
            <div className="text-center py-12 bg-slate-50/30">
              <Truck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="font-semibold text-slate-700 text-sm">No se encontraron servicios</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                No hay registros coincidentes con los filtros seleccionados o la base de datos está vacía.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs text-slate-600">
                <thead className="bg-white border-b border-slate-100 text-slate-400 font-bold uppercase tracking-widest">
                  <tr>
                    <th className="px-6 py-4">Fecha</th>
                    <th className="px-6 py-4">N° Serv</th>
                    <th className="px-6 py-4">Matrícula</th>
                    <th className="px-6 py-4">Cliente / Razón Social</th>
                    <th className="px-6 py-4">Región / Comuna</th>
                    <th className="px-6 py-4">Servicio Realizado</th>
                    <th className="px-6 py-4">N° SIDREP</th>
                    <th className="px-6 py-4">Carga (Est)</th>
                    <th className="px-6 py-4">Guía Despacho</th>
                    <th className="px-6 py-4">Conductor</th>
                    <th className="px-6 py-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {serviciosFiltrados.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap font-semibold text-slate-900">
                        {formatearFecha(item.fecha)}
                      </td>
                      <td className="px-6 py-4 font-bold text-blue-600">
                        #{item.numServicio}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-slate-100 text-slate-800 border border-slate-200 uppercase tracking-wider">
                          {item.patente || configEmpresa.patenteVehiculo || "TFTB63"}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-800">
                        {item.razonSocial}
                      </td>
                      <td className="px-8 py-4 font-bold text-slate-700 bg-slate-50/10">
                        {item.regionComuna || "N/A"}
                      </td>
                      <td className="px-8 py-4 text-slate-500 max-w-[220px] truncate font-medium" title={item.servicioRealizado}>
                        {item.servicioRealizado}
                      </td>
                      <td className="px-8 py-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                          item.numSidrep === "N/A" ? "bg-slate-50 text-slate-400 border border-slate-100" : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}>
                          {item.numSidrep}
                        </span>
                      </td>
                      <td className="px-8 py-4 whitespace-nowrap font-bold text-slate-900">
                        {formatearPeso(item.pesoEstimado)}
                      </td>
                      <td className="px-8 py-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                          item.numGuia === "N/A" ? "bg-slate-50 text-slate-400 border border-slate-100" : "bg-blue-50 text-blue-700 border border-blue-200"
                        }`}>
                          {item.numGuia}
                        </span>
                      </td>
                      <td className="px-8 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          {/* Initials avatar matching Sleek mockup pattern */}
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold shrink-0 shadow-xs">
                            {getInitials(item.conductor)}
                          </div>
                          <span className="text-sm font-bold text-slate-800">{item.conductor}</span>
                        </div>
                      </td>
                      <td className="px-8 py-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button 
                            onClick={() => iniciarEdicion(item)}
                            className="text-slate-400 hover:text-blue-600 p-1.5 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
                            title="Editar Registro"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleEliminar(item.id)}
                            className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Eliminar Registro"
                          >
                            <Trash2 className="w-4.5 h-4.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Table status footer */}
          <div className="px-8 py-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <p>Mostrando {serviciosFiltrados.length} de {servicios.length} servicios registrados en el sistema de control</p>
            <div className="flex items-center gap-1.5 font-semibold text-[10px] text-slate-400 uppercase tracking-widest">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              <span>Guardado Seguro Local Activado</span>
            </div>
          </div>

        </div>
          </>
        )}

      </main>

      {/* Edit User Modal */}
      <AnimatePresence>
        {usuarioEditando && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                    <Pencil className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 uppercase tracking-wide">Editar Cuenta</h3>
                    <p className="text-xs text-slate-500">Modifica los accesos de {usuarioEditando.usuario}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setUsuarioEditando(null)}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleGuardarEditUsuario} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Nombre Completo *
                  </label>
                  <input 
                    type="text"
                    value={usuarioEditando.nombre}
                    onChange={(e) => setUsuarioEditando({ ...usuarioEditando, nombre: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 bg-slate-50 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm font-semibold transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Usuario de Ingreso *
                  </label>
                  <input 
                    type="text"
                    value={usuarioEditando.usuario}
                    onChange={(e) => setUsuarioEditando({ ...usuarioEditando, usuario: e.target.value })}
                    disabled={usuarioEditando.id === "admin-default"} // prevent changing core admin username
                    className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm font-semibold transition-all ${
                      usuarioEditando.id === "admin-default" ? "bg-slate-100 text-slate-400 cursor-not-allowed border-slate-200" : "bg-slate-50 focus:bg-white border-slate-200"
                    }`}
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Contraseña *
                  </label>
                  <input 
                    type="text"
                    value={usuarioEditando.contrasena}
                    onChange={(e) => setUsuarioEditando({ ...usuarioEditando, contrasena: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 bg-slate-50 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm font-semibold transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span>Rol Asignado *</span>
                    {usuarioActual?.rol !== "Administrador" && (
                      <span className="text-[9px] text-amber-600 font-bold bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">Solo Admin</span>
                    )}
                  </label>
                  <select
                    value={usuarioEditando.rol}
                    onChange={(e) => setUsuarioEditando({ ...usuarioEditando, rol: e.target.value as any })}
                    disabled={usuarioActual?.rol !== "Administrador" || usuarioEditando.id === "admin-default"} // can't demote system admin
                    className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm font-bold text-slate-700 transition-all cursor-pointer ${
                      (usuarioActual?.rol !== "Administrador" || usuarioEditando.id === "admin-default")
                        ? "bg-slate-100 text-slate-400 cursor-not-allowed border-slate-200"
                        : "bg-slate-50 focus:bg-white border-slate-200"
                    }`}
                  >
                    <option value="Administrador">Administrador</option>
                    <option value="Operador">Operador (Ingresos y Reportes)</option>
                    <option value="Conductor">Conductor (Lectura o Rutas)</option>
                  </select>
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                  <button 
                    type="button"
                    onClick={() => setUsuarioEditando(null)}
                    className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-full text-xs transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-full shadow-xs hover:shadow-md transition-all flex items-center space-x-1.5 text-xs active:scale-95 cursor-pointer"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Guardar Cambios</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {editandoPerfil && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 uppercase tracking-wide">Editar Mi Perfil</h3>
                    <p className="text-xs text-slate-500">Actualiza tus datos de acceso personales</p>
                  </div>
                </div>
                <button 
                  onClick={() => setEditandoPerfil(false)}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleGuardarPerfil} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Mi Nombre Completo *
                  </label>
                  <input 
                    type="text"
                    value={perfilNombre}
                    onChange={(e) => setPerfilNombre(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 bg-slate-50 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm font-semibold transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Usuario de Ingreso *
                  </label>
                  <input 
                    type="text"
                    value={perfilUsuario}
                    onChange={(e) => setPerfilUsuario(e.target.value)}
                    disabled={usuarioActual?.id === "admin-default"} // prevent changing core admin username
                    className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm font-semibold transition-all ${
                      usuarioActual?.id === "admin-default" ? "bg-slate-100 text-slate-400 cursor-not-allowed border-slate-200" : "bg-slate-50 focus:bg-white border-slate-200"
                    }`}
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Nueva Contraseña *
                  </label>
                  <input 
                    type="text"
                    value={perfilContrasena}
                    onChange={(e) => setPerfilContrasena(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 bg-slate-50 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm font-semibold transition-all"
                    required
                  />
                </div>

                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs text-slate-500 flex flex-col gap-1">
                  <div>Rol actual: <span className="font-bold text-slate-700 uppercase">{usuarioActual?.rol}</span></div>
                  <div className="text-[10px] text-slate-400">El rol de tu perfil solo puede ser modificado por un Administrador desde la gestión de usuarios.</div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                  <button 
                    type="button"
                    onClick={() => setEditandoPerfil(false)}
                    className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-full text-xs transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-full shadow-xs hover:shadow-md transition-all flex items-center space-x-1.5 text-xs active:scale-95 cursor-pointer"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Guardar Cambios</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Service Modal */}
      <AnimatePresence>
        {editandoServicio && editFormData && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                    <Pencil className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 uppercase tracking-wide">Editar Registro de Servicio</h3>
                    <p className="text-xs text-slate-500">Modifica los detalles del servicio #{editFormData.numServicio}</p>
                  </div>
                </div>
                <button 
                  onClick={() => { setEditandoServicio(null); setEditFormData(null); }}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleGuardarEdicion} className="space-y-5">
                {/* Row 1: Date, Service ID, Matrícula/Patente, Conductor */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Fecha del Servicio *
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                      <input 
                        type="date"
                        name="fecha"
                        value={editFormData.fecha}
                        onChange={handleEditInputChange}
                        className="w-full pl-10 pr-3 py-2.5 border border-slate-200 bg-slate-50 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-sm font-medium transition-all"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Número de Servicio *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-2.5 text-sm font-bold text-slate-400">#</span>
                      <input 
                        type="text"
                        name="numServicio"
                        value={editFormData.numServicio}
                        onChange={handleEditInputChange}
                        placeholder="Ej: 1250"
                        className="w-full pl-8 pr-3 py-2.5 border border-slate-200 bg-slate-50 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-sm font-bold transition-all placeholder:font-normal"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Matrícula / Patente *
                    </label>
                    <div className="relative">
                      <Truck className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                      <input 
                        type="text"
                        name="patente"
                        value={editFormData.patente || ""}
                        onChange={(e) => setEditFormData(prev => prev ? ({ ...prev, patente: e.target.value.toUpperCase() }) : null)}
                        placeholder="Ej: TFTB63"
                        className="w-full pl-10 pr-3 py-2.5 border border-slate-200 bg-slate-50 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-sm font-bold font-mono tracking-wider uppercase transition-all"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                      <span>Conductor Asignado *</span>
                      <button
                        type="button"
                        onClick={() => setEditInputModeConductor(prev => prev === "select" ? "custom" : "select")}
                        className="text-[10px] text-blue-600 hover:underline font-bold"
                      >
                        {editInputModeConductor === "select" ? "✏️ Escribir manual" : "📋 Elegir del catálogo"}
                      </button>
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                      {editInputModeConductor === "select" ? (
                        <select
                          name="conductor"
                          value={editFormData.conductor}
                          onChange={(e) => {
                            if (e.target.value === "__MANAGE__") {
                              setVistaActiva("nomencladores");
                              setTabActivoNomenclador("conductores");
                              setEditandoServicio(null);
                              setEditFormData(null);
                              triggerNotificacion("Abriendo administración de conductores...", "info");
                            } else {
                              setEditFormData(prev => prev ? ({ ...prev, conductor: e.target.value }) : null);
                            }
                          }}
                          className="w-full pl-10 pr-3 py-2.5 border border-slate-200 bg-slate-50 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-sm font-semibold transition-all appearance-none cursor-pointer"
                          required
                        >
                          <option value="">-- Seleccione Conductor --</option>
                          {catConductores.map(c => (
                            <option key={c.id} value={c.nombre}>{c.nombre}</option>
                          ))}
                          <option value="__MANAGE__" className="text-blue-600 font-bold">⚙️ Administrar Catálogo...</option>
                        </select>
                      ) : (
                        <input 
                          type="text"
                          name="conductor"
                          value={editFormData.conductor}
                          onChange={handleEditInputChange}
                          placeholder="Nombre del conductor"
                          className="w-full pl-10 pr-3 py-2.5 border border-slate-200 bg-slate-50 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-sm font-semibold transition-all"
                          required
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* Row 2: Client, Region/Commune and Description */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                      <span>Razón Social / Cliente *</span>
                      <button
                        type="button"
                        onClick={() => setEditInputModeCliente(prev => prev === "select" ? "custom" : "select")}
                        className="text-[10px] text-blue-600 hover:underline font-bold"
                      >
                        {editInputModeCliente === "select" ? "✏️ Escribir manual" : "📋 Elegir del catálogo"}
                      </button>
                    </label>
                    {editInputModeCliente === "select" ? (
                      <select
                        name="razonSocial"
                        value={editFormData.razonSocial}
                        onChange={(e) => {
                          if (e.target.value === "__MANAGE__") {
                            setVistaActiva("nomencladores");
                            setTabActivoNomenclador("clientes");
                            setEditandoServicio(null);
                            setEditFormData(null);
                            triggerNotificacion("Abriendo administración de clientes...", "info");
                          } else {
                            setEditFormData(prev => prev ? ({ ...prev, razonSocial: e.target.value }) : null);
                          }
                        }}
                        className="w-full px-4 py-2.5 border border-slate-200 bg-slate-50 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-sm font-semibold transition-all appearance-none cursor-pointer"
                        required
                      >
                        <option value="">-- Seleccione Cliente --</option>
                        {catClientes.map(c => (
                          <option key={c.id} value={c.nombre}>{c.nombre}</option>
                        ))}
                        <option value="__MANAGE__" className="text-blue-600 font-bold">⚙️ Administrar Catálogo...</option>
                      </select>
                    ) : (
                      <input 
                        type="text"
                        name="razonSocial"
                        value={editFormData.razonSocial}
                        onChange={handleEditInputChange}
                        placeholder="Ej: Minera del Norte S.A."
                        className="w-full px-4 py-2.5 border border-slate-200 bg-slate-50 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-sm font-semibold transition-all"
                        required
                      />
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                      <span>Región / Comuna *</span>
                      <button
                        type="button"
                        onClick={() => setEditInputModeRegion(prev => prev === "select" ? "custom" : "select")}
                        className="text-[10px] text-blue-600 hover:underline font-bold"
                      >
                        {editInputModeRegion === "select" ? "✏️ Escribir manual" : "📋 Elegir del catálogo"}
                      </button>
                    </label>
                    {editInputModeRegion === "select" ? (
                      <select
                        name="regionComuna"
                        value={editFormData.regionComuna || ""}
                        onChange={(e) => {
                          if (e.target.value === "__MANAGE__") {
                            setVistaActiva("nomencladores");
                            setTabActivoNomenclador("regiones");
                            setEditandoServicio(null);
                            setEditFormData(null);
                            triggerNotificacion("Abriendo administración de regiones...", "info");
                          } else {
                            setEditFormData(prev => prev ? ({ ...prev, regionComuna: e.target.value }) : null);
                          }
                        }}
                        className="w-full px-4 py-2.5 border border-slate-200 bg-slate-50 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-sm font-semibold transition-all appearance-none cursor-pointer"
                        required
                      >
                        <option value="">-- Seleccione Región / Comuna --</option>
                        {catRegiones.map(r => (
                          <option key={r.id} value={r.nombre}>{r.nombre}</option>
                        ))}
                        <option value="__MANAGE__" className="text-blue-600 font-bold">⚙️ Administrar Catálogo...</option>
                      </select>
                    ) : (
                      <input 
                        type="text"
                        name="regionComuna"
                        value={editFormData.regionComuna || ""}
                        onChange={handleEditInputChange}
                        placeholder="Ej: Antofagasta / Sierra Gorda"
                        className="w-full px-4 py-2.5 border border-slate-200 bg-slate-50 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-sm font-semibold transition-all"
                        required
                      />
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Servicio Realizado *
                    </label>
                    <input 
                      type="text"
                      name="servicioRealizado"
                      value={editFormData.servicioRealizado}
                      onChange={handleEditInputChange}
                      placeholder="Ej: Traslado de concentrado de cobre y retiro de residuos"
                      className="w-full px-4 py-2.5 border border-slate-200 bg-slate-50 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-sm font-semibold transition-all"
                      required
                    />
                  </div>
                </div>

                {/* Row 3: SIDREP & Peso & Dispatch Guide */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-200">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                      <span>Número SIDREP</span>
                      <span className="text-[10px] text-amber-600 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">Si aplica</span>
                    </label>
                    <input 
                      type="text"
                      name="numSidrep"
                      value={editFormData.numSidrep === "N/A" ? "" : editFormData.numSidrep}
                      onChange={handleEditInputChange}
                      placeholder="Ej: SD-44510"
                      className="w-full px-4 py-2.5 border border-slate-200 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm font-medium transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                      <span>Peso Est. SIDREP (kg)</span>
                      <span className="text-[10px] text-slate-400 font-normal">Requerido SIDREP</span>
                    </label>
                    <input 
                      type="number"
                      name="pesoEstimado"
                      value={editFormData.pesoEstimado === "0" && (!editFormData.numSidrep || editFormData.numSidrep === "N/A") ? "" : editFormData.pesoEstimado}
                      onChange={handleEditInputChange}
                      disabled={!editFormData.numSidrep || editFormData.numSidrep.trim() === "" || editFormData.numSidrep.trim() === "N/A"}
                      placeholder="Ej: 4500"
                      className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm font-semibold transition-all ${
                        (!editFormData.numSidrep || editFormData.numSidrep.trim() === "" || editFormData.numSidrep.trim() === "N/A")
                          ? "bg-slate-200 text-slate-400 cursor-not-allowed border-slate-200" 
                          : "bg-white border-slate-200"
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                      <span>N° Guía Despacho</span>
                      <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">Despacho</span>
                    </label>
                    <input 
                      type="text"
                      name="numGuia"
                      value={editFormData.numGuia === "N/A" ? "" : editFormData.numGuia}
                      onChange={handleEditInputChange}
                      placeholder="Ej: GD-778901"
                      className="w-full px-4 py-2.5 border border-slate-200 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm font-medium transition-all"
                    />
                  </div>
                </div>

                {/* Action buttons */}
                <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                  <button 
                    type="button"
                    onClick={() => { setEditandoServicio(null); setEditFormData(null); }}
                    className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-full text-sm transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-full shadow-xs hover:shadow-md transition-all flex items-center space-x-2 text-sm active:scale-95 cursor-pointer"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Guardar Cambios</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Save File Helper Explanation Modal */}
      <AnimatePresence>
        {mostrarAyudaPDF && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100"
            >
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Info className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900">¿Deseas elegir dónde guardar tu PDF?</h3>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  Si tu navegador descargó el reporte automáticamente sin preguntarte por la carpeta de destino, puedes configurar este comportamiento:
                </p>
                
                <div className="bg-slate-50 text-left p-3.5 rounded-xl border border-slate-200 mt-3.5 text-[11px] space-y-1.5 text-slate-600 font-medium">
                  <p className="font-bold text-slate-800">En Google Chrome / Microsoft Edge:</p>
                  <p>1. Ve al menú superior y selecciona <strong>Configuración</strong>.</p>
                  <p>2. Escribe <strong>Descargas</strong> en la barra de búsqueda.</p>
                  <p>3. Activa la opción: <em>"Preguntar dónde se guardará cada archivo antes de descargarlo"</em>.</p>
                </div>

                <button
                  onClick={() => setMostrarAyudaPDF(false)}
                  className="mt-5 w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Entendido
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="h-14 border-t border-slate-100 bg-white flex items-center px-8 justify-between shrink-0 text-slate-400 font-medium">
        <p className="text-[10px] uppercase tracking-widest font-bold">Via Limpia TFTB63 — Sistema de Gestión Operativa &copy; 2026</p>
        <div className="flex gap-4">
          <span className="text-[10px] uppercase tracking-widest font-bold text-blue-600">Status: Online</span>
          <span className="text-[10px] uppercase tracking-widest font-bold">V.2.5.0</span>
        </div>
      </footer>

      </div>
    </div>
  );
}
