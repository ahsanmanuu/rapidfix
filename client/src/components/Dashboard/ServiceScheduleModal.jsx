import React, { useState } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, TextField, Box, Typography, IconButton, Grid,
    Select, MenuItem, InputLabel, FormControl
} from '@mui/material';
import { Close, CalendarMonth, AccessTime, LocationOn } from '@mui/icons-material';
import { createJob } from '../../services/api';

const ServiceScheduleModal = ({ open, onClose, serviceType, user, onJobCreated }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        serviceType: serviceType || '',
        date: '',
        time: '',
        address: user?.location?.address || user?.location || '',
        description: ''
    });

    React.useEffect(() => {
        if (serviceType) {
            setFormData(prev => ({ ...prev, serviceType }));
        }
    }, [serviceType]);

    // Pre-fill address when user changes
    React.useEffect(() => {
        if (user?.location) {
            setFormData(prev => ({ ...prev, address: user.location.address || user.location }));
        }
    }, [user]);

    const serviceOptions = [
        'Electrician', 'Plumber', 'Painter', 'A.C. Technician',
        'Inverter Technician', 'CCTV Technician', 'Biometrics Technician', 'Printer Technician'
    ];

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async () => {
        if (!formData.serviceType || !formData.date || !formData.time || !formData.address) {
            return alert("Please fill in all required fields.");
        }

        setIsSubmitting(true);
        try {
            const payload = {
                userId: user.id,
                serviceType: formData.serviceType,
                scheduledDate: formData.date,
                scheduledTime: formData.time,
                address: formData.address,
                description: formData.description || "Scheduled through Service Hub",
                status: 'pending'
            };

            console.log("[ScheduleModal] Sending payload:", JSON.stringify(payload, null, 2));
            const response = await createJob(payload);
            if (response.data.success || response.status === 200) {
                alert(`Successfully scheduled ${formData.serviceType} for ${formData.date} at ${formData.time}`);
                onClose();
                // Trigger a refresh via callback instead of full page reload
                if (onJobCreated) onJobCreated(response.data.job);
            }
        } catch (err) {
            console.error("Scheduling failed:", err);
            const errorMsg = err.response?.data?.error || err.message;
            const details = err.response?.data?.details ? `\n\nDetails: ${err.response.data.details}` : '';
            const hint = err.response?.data?.hint ? `\nHint: ${err.response.data.hint}` : '';
            alert(`Failed to schedule service: ${errorMsg}${details}${hint}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: '16px' } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, borderBottom: '1px solid #f1f5f9' }}>
                <Typography variant="h6" fontWeight="bold">Schedule {formData.serviceType || 'Service'}</Typography>
                <IconButton onClick={onClose} size="small"><Close /></IconButton>
            </Box>

            <DialogContent sx={{ p: 3 }}>
                <Box sx={{ mb: 3, p: 2, bgcolor: '#eff6ff', borderRadius: '8px', border: '1px solid #dbeafe' }}>
                    <Typography variant="subtitle2" fontWeight="bold" color="primary">Expert {formData.serviceType || 'Technician'}</Typography>
                    <Typography variant="caption" color="textSecondary">Standard rates apply. Estimate provided upon confirmation.</Typography>
                </Box>

                <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, width: '100%' }}>
                    <FormControl fullWidth variant="outlined">
                        <InputLabel id="service-type-label">Technician Type</InputLabel>
                        <Select
                            labelId="service-type-label"
                            name="serviceType"
                            value={formData.serviceType}
                            label="Technician Type"
                            onChange={handleChange}
                            sx={{ borderRadius: '8px' }}
                        >
                            {serviceOptions.map((option) => (
                                <MenuItem key={option} value={option}>{option}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <TextField
                            fullWidth
                            label="Date"
                            type="date"
                            name="date"
                            value={formData.date}
                            onChange={handleChange}
                            InputLabelProps={{ shrink: true }}
                            InputProps={{ startAdornment: <CalendarMonth fontSize="small" sx={{ mr: 1, color: '#64748b' }} /> }}
                        />
                        <TextField
                            fullWidth
                            label="Time"
                            type="time"
                            name="time"
                            value={formData.time}
                            onChange={handleChange}
                            InputLabelProps={{ shrink: true }}
                            InputProps={{ startAdornment: <AccessTime fontSize="small" sx={{ mr: 1, color: '#64748b' }} /> }}
                        />
                    </Box>

                    <TextField
                        fullWidth
                        label="Address"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        InputProps={{ startAdornment: <LocationOn fontSize="small" sx={{ mr: 1, color: '#64748b' }} /> }}
                    />

                    <TextField
                        fullWidth
                        multiline
                        rows={3}
                        label="Problem Description"
                        placeholder="Describe the issue..."
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                    />
                </Box>
            </DialogContent>

            <DialogActions sx={{ p: 3, borderTop: '1px solid #f1f5f9' }}>
                <Button onClick={onClose} sx={{ color: '#64748b' }} disabled={isSubmitting}>Cancel</Button>
                <Button variant="contained" onClick={handleSubmit} fullWidth sx={{ bgcolor: '#447aee', fontWeight: 'bold' }} disabled={isSubmitting}>
                    {isSubmitting ? 'Scheduling...' : 'Confirm Schedule'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ServiceScheduleModal;
