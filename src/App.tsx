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
  Key
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
  servicioRealizado: string;
  numSidrep: string;
  pesoEstimado: string;
  numGuia: string;
  conductor: string; // Renamed from chofer according to instructions
}

// Define interface for system users
interface Usuario {
  id: string;
  usuario: string;
  nombre: string;
  contrasena: string;
  rol: "Administrador" | "Operador" | "Conductor";
}

// Initial seed data with "conductor"
const DEFAULTS_SERVICIOS: Servicio[] = [
  {
    id: "1",
    fecha: "2026-07-01",
    numServicio: "1250",
    razonSocial: "Minera del Norte S.A.",
    servicioRealizado: "Traslado de concentrado de cobre y retiro de residuos",
    numSidrep: "SD-44510",
    pesoEstimado: "4500",
    numGuia: "GD-778901",
    conductor: "Carlos Mendoza"
  },
  {
    id: "2",
    fecha: "2026-07-01",
    numServicio: "1251",
    razonSocial: "Distribuidora del Sur",
    servicioRealizado: "Flete de mercadería seca y paletizada",
    numSidrep: "N/A",
    pesoEstimado: "0",
    numGuia: "GD-778902",
    conductor: "Juan Pablo Silva"
  },
  {
    id: "3",
    fecha: "2026-07-02",
    numServicio: "1252",
    razonSocial: "Constructora Cordillera",
    servicioRealizado: "Transporte de maquinaria pesada a faena",
    numSidrep: "N/A",
    pesoEstimado: "0",
    numGuia: "GD-778915",
    conductor: "Carlos Mendoza"
  },
  {
    id: "4",
    fecha: "2026-06-28",
    numServicio: "1210",
    razonSocial: "Industrias Químicas Omega",
    servicioRealizado: "Despacho de sustancias peligrosas en estanques",
    numSidrep: "SD-44320",
    pesoEstimado: "8200",
    numGuia: "GD-775402",
    conductor: "Mauricio Ortega"
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

  // Form input state
  const [formData, setFormData] = useState<Omit<Servicio, "id">>({
    fecha: new Date().toISOString().split("T")[0],
    numServicio: "",
    razonSocial: "",
    servicioRealizado: "",
    numSidrep: "",
    pesoEstimado: "",
    numGuia: "",
    conductor: ""
  });

  // Filter & search states
  const [busqueda, setBusqueda] = useState<string>("");
  const [filtroConductor, setFiltroConductor] = useState<string>("Todos");

  // PDF report settings
  const [reporteTipo, setReporteTipo] = useState<"dia" | "rango" | "mes">("mes");
  const [reporteFechaDia, setReporteFechaDia] = useState<string>(new Date().toISOString().split("T")[0]);
  const [reporteFechaInicio, setReporteFechaInicio] = useState<string>("");
  const [reporteFechaFin, setReporteFechaFin] = useState<string>("");
  const [reporteMes, setReporteMes] = useState<string>(new Date().toISOString().substring(0, 7));

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
  const [vistaActiva, setVistaActiva] = useState<"servicios" | "usuarios">("servicios");

  // User form states (for creating a user)
  const [nuevoNombre, setNuevoNombre] = useState<string>("");
  const [nuevoUsuario, setNuevoUsuario] = useState<string>("");
  const [nuevaContrasena, setNuevaContrasena] = useState<string>("");
  const [nuevoRol, setNuevoRol] = useState<"Administrador" | "Operador" | "Conductor">("Operador");

  // User edit modal states
  const [usuarioEditando, setUsuarioEditando] = useState<Usuario | null>(null);

  // User Profile States
  const [mostrarMenuPerfil, setMostrarMenuPerfil] = useState<boolean>(false);
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
    setEditFormData({ ...servicio });
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

    if (!editFormData.fecha || !editFormData.numServicio || !editFormData.razonSocial || !editFormData.servicioRealizado || !editFormData.conductor) {
      triggerNotificacion("Por favor completa todos los campos obligatorios (*).", "error");
      return;
    }

    const servicioGuardado: Servicio = {
      ...editFormData,
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
    if (!formData.fecha || !formData.numServicio || !formData.razonSocial || !formData.servicioRealizado || !formData.conductor) {
      triggerNotificacion("Por favor completa todos los campos obligatorios (*).", "error");
      return;
    }

    const nuevoServicio: Servicio = {
      ...formData,
      id: Date.now().toString(),
      numSidrep: formData.numSidrep.trim() || "N/A",
      pesoEstimado: formData.numSidrep.trim() ? (formData.pesoEstimado || "0") : "0",
      numGuia: formData.numGuia.trim() || "N/A",
      conductor: formData.conductor.trim()
    };

    setServicios(prev => [nuevoServicio, ...prev]);
    triggerNotificacion("¡Servicio ingresado y guardado correctamente!");

    // Reset keeping date and conductor for fast repetitive logging
    setFormData(prev => ({
      fecha: prev.fecha,
      numServicio: "",
      razonSocial: "",
      servicioRealizado: "",
      numSidrep: "",
      pesoEstimado: "",
      numGuia: "",
      conductor: prev.conductor
    }));
  };

  // Delete a service
  const handleEliminar = (id: string) => {
    if (window.confirm("¿Está seguro de que desea eliminar permanentemente este registro de servicio?")) {
      setServicios(prev => prev.filter(s => s.id !== id));
      triggerNotificacion("Registro de servicio eliminado.", "info");
    }
  };

  // Export local JSON DB
  const exportarBaseDatos = () => {
    try {
      const dataStr = JSON.stringify(servicios, null, 2);
      const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
      const nombreArchivo = `BD_Servicios_Via_Limpia_${new Date().toISOString().split("T")[0]}.json`;

      const linkElement = document.createElement("a");
      linkElement.setAttribute("href", dataUri);
      linkElement.setAttribute("download", nombreArchivo);
      linkElement.click();

      triggerNotificacion("Base de datos exportada con éxito. Guarde el archivo para respaldos.");
    } catch (error) {
      triggerNotificacion("Ocurrió un error al exportar la base de datos.", "error");
    }
  };

  // Import local JSON DB
  const importarBaseDatos = (e: ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    const file = e.target.files?.[0];
    if (!file) return;

    fileReader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          // Validate structure minimally
          const valid = parsed.every(item => item.fecha && item.numServicio && item.razonSocial && (item.conductor || item.chofer));
          if (valid) {
            if (window.confirm(`Se cargarán ${parsed.length} registros. Esto reemplazará tu base de datos actual. ¿Deseas continuar?`)) {
              // Convert "chofer" to "conductor" if any old record exists
              const migracion = parsed.map(item => ({
                ...item,
                conductor: item.conductor || item.chofer || "Sin Conductor"
              }));
              setServicios(migracion);
              triggerNotificacion("Base de datos importada y restaurada con éxito.");
            }
          } else {
            triggerNotificacion("El archivo no tiene el formato correcto de base de datos.", "error");
          }
        } else {
          triggerNotificacion("El archivo JSON no contiene un arreglo válido.", "error");
        }
      } catch (error) {
        triggerNotificacion("No se pudo leer el archivo JSON.", "error");
      }
    };
    fileReader.readAsText(file);
    e.target.value = "";
  };

  // Unique list of conductors for interactive filters
  const listaConductores = useMemo(() => {
    const conds = servicios.map(s => s.conductor.trim()).filter(Boolean);
    return ["Todos", ...Array.from(new Set(conds))];
  }, [servicios]);

  // Main UI Filter Logic
  const serviciosFiltrados = useMemo(() => {
    return servicios.filter(s => {
      const q = busqueda.toLowerCase();
      const cumpleBusqueda = 
        s.numServicio.toLowerCase().includes(q) ||
        s.razonSocial.toLowerCase().includes(q) ||
        s.servicioRealizado.toLowerCase().includes(q) ||
        s.numSidrep.toLowerCase().includes(q) ||
        s.numGuia.toLowerCase().includes(q) ||
        s.conductor.toLowerCase().includes(q);

      const cumpleConductor = filtroConductor === "Todos" || s.conductor === filtroConductor;

      return cumpleBusqueda && cumpleConductor;
    });
  }, [servicios, busqueda, filtroConductor]);

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

    if (datosReporte.length === 0) {
      triggerNotificacion("No se encontraron registros para el periodo indicado.", "info");
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

    // Title in Header: changed to Via Limpia TFTB63 instead of "Logística camión"
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("REPORTE OPERATIVO DE SERVICIOS - VIA LIMPIA TFTB63", 12, 15);

    // Meta-info top right
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    doc.text(`Generado: ${new Date().toLocaleDateString("es-CL")} a las ${new Date().toLocaleTimeString("es-CL")}`, 200, 15);

    // Filter information under the header
    doc.setTextColor(colorTexto[0], colorTexto[1], colorTexto[2]);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.text("Periodo del Reporte:", 12, 32);

    doc.setFont("helvetica", "normal");
    doc.text(subtituloPeriodo, 55, 32);
    doc.text(`Total Servicios: ${datosReporte.length}`, 200, 32);

    // Underline
    doc.setDrawColor(colorLineas[0], colorLineas[1], colorLineas[2]);
    doc.setLineWidth(0.4);
    doc.line(12, 36, anchoCarta - 12, 36);

    let posicionY = 42;

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

      // Table mapping for autoTable. Header changed from "Chofer" to "Conductor"
      const filasDeTabla = listaDeEstaFecha.map(item => [
        item.numServicio,
        item.razonSocial,
        item.servicioRealizado,
        item.numSidrep,
        formatearPeso(item.pesoEstimado),
        item.numGuia,
        item.conductor // Conductor instead of chofer
      ]);

      autoTable(doc, {
        startY: posicionY,
        head: [["N° Serv.", "Razón Social / Cliente", "Servicio Realizado", "N° SIDREP", "Peso Est.", "N° Guía Despacho", "Conductor"]],
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
          0: { cellWidth: 18 }, // N° Serv
          1: { cellWidth: 48 }, // Razón Social
          2: { cellWidth: 78 }, // Servicio realizado
          3: { cellWidth: 26 }, // SIDREP
          4: { cellWidth: 22 }, // Peso
          5: { cellWidth: 32 }, // Guía
          6: { cellWidth: 31 }  // Conductor (renamed from chofer)
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
              Via Limpia TFTB63
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
    <div className="flex flex-col min-h-screen bg-[#F8FAFC] font-sans text-slate-800 antialiased">
      
      {/* Sleek Design Top Header Bar */}
      <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-6 sm:px-8 shrink-0 sticky top-0 z-40 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="bg-blue-600 p-2.5 rounded-xl shadow-xs shrink-0 flex items-center justify-center">
            <Truck className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 uppercase font-display">
              Via Limpia TFTB63
            </h1>
            <p className="text-[10px] sm:text-xs text-slate-500 font-semibold tracking-widest uppercase">
              Panel de Reporte Operativo de Camiones
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 sm:gap-6">


          <div className="flex items-center gap-2">
            <button
              onClick={() => setVistaActiva(prev => prev === "servicios" ? "usuarios" : "servicios")}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-xs active:scale-95 ${
                vistaActiva === "usuarios" 
                  ? "bg-blue-600 text-white border border-blue-600 hover:bg-blue-700" 
                  : "bg-white hover:bg-slate-50 text-slate-700 border border-slate-200"
              }`}
              title="Gestionar usuarios y roles del sistema"
            >
              <Users className="w-3.5 h-3.5" />
              <span>{vistaActiva === "usuarios" ? "Ver Servicios" : "Gestión Usuarios"}</span>
            </button>

            {/* Database backups styled elegantly as rounded outlines */}
            <button
              onClick={exportarBaseDatos}
              className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-xs active:scale-95"
              title="Exportar base de datos a un archivo JSON"
            >
              <Download className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden sm:inline">Respaldar BD</span>
            </button>
            
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-xs active:scale-95"
              title="Importar un archivo JSON de respaldo"
            >
              <Upload className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Cargar BD</span>
            </button>

            {/* Interactive Profile Menu */}
            <div className="relative">
              <button
                onClick={() => setMostrarMenuPerfil(prev => !prev)}
                className="bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-all shadow-md active:scale-95 cursor-pointer text-left"
                title="Menú de Perfil"
              >
                <div className="w-5 h-5 rounded-full bg-blue-500 text-white font-bold text-[10px] flex items-center justify-center shadow-xs">
                  {usuarioActual?.nombre.charAt(0).toUpperCase()}
                </div>
                <span className="max-w-[120px] truncate capitalize">{usuarioActual?.nombre.split(" ")[0]}</span>
                <span className="text-[8px] opacity-75">▼</span>
              </button>

              <AnimatePresence>
                {mostrarMenuPerfil && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setMostrarMenuPerfil(false)} 
                    />
                    
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 z-50 space-y-3 text-left"
                    >
                      <div className="border-b border-slate-100 pb-3">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Usuario Conectado</p>
                        <div className="flex items-center gap-2.5 mt-2">
                          <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold text-sm flex items-center justify-center">
                            {usuarioActual?.nombre.charAt(0).toUpperCase()}
                          </div>
                          <div className="overflow-hidden">
                            <h4 className="font-bold text-slate-800 text-sm leading-tight capitalize truncate">{usuarioActual?.nombre}</h4>
                            <span className="text-[10px] bg-slate-100 text-slate-600 border border-slate-200 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider inline-block mt-1">
                              {usuarioActual?.rol}
                            </span>
                          </div>
                        </div>
                        <div className="text-[11px] text-slate-400 font-medium mt-3 bg-slate-50 p-2 rounded-xl border border-slate-100 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-blue-500" />
                          <span>Hoy: {new Date().toLocaleDateString("es-CL", { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <button
                          onClick={iniciarEdicionPerfil}
                          className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5 text-blue-600" />
                          <span>Editar Mi Perfil</span>
                        </button>
                        
                        <button
                          onClick={() => {
                            setMostrarMenuPerfil(false);
                            handleLogout();
                          }}
                          className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold text-rose-700 hover:bg-rose-50 flex items-center gap-2 transition-colors cursor-pointer"
                        >
                          <LogOut className="w-3.5 h-3.5 text-rose-600" />
                          <span>Cerrar Sesión</span>
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            <input 
              type="file"
              ref={fileInputRef}
              onChange={importarBaseDatos}
              accept=".json"
              className="hidden"
            />
          </div>
        </div>
      </header>

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

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 sm:p-8 space-y-8">

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
              
              {/* Row 1: Date, Service ID, Conductor */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                    Conductor Asignado *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input 
                      type="text"
                      name="conductor"
                      value={formData.conductor}
                      onChange={handleInputChange}
                      placeholder="Nombre del conductor"
                      className="w-full pl-10 pr-3 py-2.5 border border-slate-200 bg-slate-50 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-sm font-semibold transition-all"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Row 2: Client and Description */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Razón Social / Cliente *
                  </label>
                  <input 
                    type="text"
                    name="razonSocial"
                    value={formData.razonSocial}
                    onChange={handleInputChange}
                    placeholder="Ej: Minera del Norte S.A."
                    className="w-full px-4 py-2.5 border border-slate-200 bg-slate-50 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-sm font-semibold transition-all"
                    required
                  />
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
                    placeholder="Ej: Retiro de residuos metalúrgicos"
                    className="w-full px-4 py-2.5 border border-slate-200 bg-slate-50 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-sm transition-all"
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
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              
              {/* Keyword Search */}
              <div className="relative">
                <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
                <input 
                  type="text"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar conductor, cliente, guía..."
                  className="pl-9 pr-4 py-2 border border-slate-200 bg-white rounded-xl text-xs w-full focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium shadow-xs"
                />
              </div>

              {/* Conductor Filter Dropdown */}
              <div className="flex items-center space-x-2 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Conductor:</span>
                <select
                  value={filtroConductor}
                  onChange={(e) => setFiltroConductor(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-700 focus:outline-none pr-2 cursor-pointer"
                >
                  {listaConductores.map((cond, i) => (
                    <option key={i} value={cond}>{cond}</option>
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
                    <th className="px-8 py-4">Fecha</th>
                    <th className="px-8 py-4">N° Serv</th>
                    <th className="px-8 py-4">Cliente / Razón Social</th>
                    <th className="px-8 py-4">Servicio Realizado</th>
                    <th className="px-8 py-4">N° SIDREP</th>
                    <th className="px-8 py-4">Carga (Est)</th>
                    <th className="px-8 py-4">Guía Despacho</th>
                    <th className="px-8 py-4">Conductor</th>
                    <th className="px-8 py-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {serviciosFiltrados.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-4 whitespace-nowrap font-semibold text-slate-900">
                        {formatearFecha(item.fecha)}
                      </td>
                      <td className="px-8 py-4 font-bold text-blue-600">
                        #{item.numServicio}
                      </td>
                      <td className="px-8 py-4 font-bold text-slate-800">
                        {item.razonSocial}
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
                {/* Row 1: Date, Service ID, Conductor */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                      Conductor Asignado *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                      <input 
                        type="text"
                        name="conductor"
                        value={editFormData.conductor}
                        onChange={handleEditInputChange}
                        placeholder="Nombre del conductor"
                        className="w-full pl-10 pr-3 py-2.5 border border-slate-200 bg-slate-50 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-sm font-semibold transition-all"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Row 2: Client and Description */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Razón Social / Cliente *
                    </label>
                    <input 
                      type="text"
                      name="razonSocial"
                      value={editFormData.razonSocial}
                      onChange={handleEditInputChange}
                      placeholder="Ej: Minera del Norte S.A."
                      className="w-full px-4 py-2.5 border border-slate-200 bg-slate-50 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-sm font-semibold transition-all"
                      required
                    />
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
                      placeholder="Ej: Retiro de residuos metalúrgicos"
                      className="w-full px-4 py-2.5 border border-slate-200 bg-slate-50 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-sm transition-all"
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
  );
}
