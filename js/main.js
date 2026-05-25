// Gestión de Citas
async function getAppointments(id_paciente = null) {
    try {
        const res = await secureFetch('/api/citas');
        if (!res) return [];
        const allCitas = await res.json();
        if (id_paciente) {
            return allCitas.filter(c => c.id_paciente == id_paciente);
        }
        return allCitas;
    } catch(err) {
        console.error('Error fetching citas:', err);
        return [];
    }
}

async function saveAppointment(apt) {
    try {
        const res = await secureFetch('/api/citas', {
            method: 'POST',
            body: JSON.stringify(apt)
        });
        if (!res) return null;
        return await res.json();
    } catch(err) {
        console.error('Error saving cita:', err);
        throw err;
    }
}
