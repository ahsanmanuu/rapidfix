import React, { useState } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, TextField, Box, Typography, IconButton, InputAdornment,
    Select, MenuItem, FormControl, InputLabel, CircularProgress
} from '@mui/material';
import { Close, AttachMoney, Image as ImageIcon, Work } from '@mui/icons-material';
import { createOffer } from '../../services/api';

const MakeOfferModal = ({ open, onClose, user }) => {
    const [loading, setLoading] = useState(false);
    const [offerData, setOfferData] = useState({
        title: '',
        price: '',
        description: '',
        jobType: '',
        photos: []
    });

    const services = [
        "Electrician", "Plumber", "Painter", "A.C. Technician",
        "CCTV Technician", "Inverter Technician", "Biometrics Technician", "Printer Technician"
    ];

    const handleChange = (e) => {
        setOfferData({ ...offerData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async () => {
        if (!user) {
            alert("Please log in to make an offer.");
            return;
        }
        if (!offerData.title || !offerData.price || !offerData.jobType) {
            alert("Please fill in all required fields.");
            return;
        }

        try {
            setLoading(true);
            await createOffer({
                title: offerData.title,
                price: parseFloat(offerData.price),
                description: offerData.description,
                jobType: offerData.jobType,
                type: 'job_bid',
                userId: user.id,
                createdBy: user.id, // For tracking
                badgeText: 'New Bid'
            });
            // Success
            alert('Offer submitted successfully! Technicians will see it shortly.');
            onClose();
            setOfferData({ title: '', price: '', description: '', jobType: '', photos: [] });
        } catch (error) {
            console.error("Failed to create offer:", error);
            const errMsg = error.response?.data?.error || error.message;
            alert("Failed to submit offer: " + errMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: '16px' } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, borderBottom: '1px solid #f1f5f9' }}>
                <Typography variant="h6" fontWeight="bold">Make a Job Offer</Typography>
                <IconButton onClick={onClose} size="small"><Close /></IconButton>
            </Box>

            <DialogContent sx={{ p: 3 }}>
                <Typography variant="body2" sx={{ color: '#64748b', mb: 3 }}>
                    Describe your custom job and propose a price. Technicians can accept or counter your offer.
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <FormControl fullWidth>
                        <InputLabel>Job Type *</InputLabel>
                        <Select
                            name="jobType"
                            value={offerData.jobType}
                            onChange={handleChange}
                            label="Job Type *"
                            startAdornment={<InputAdornment position="start"><Work fontSize="small" /></InputAdornment>}
                        >
                            {services.map((service) => (
                                <MenuItem key={service} value={service}>{service}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <TextField
                        fullWidth
                        label="Job Title *"
                        placeholder="e.g., Fix Leaky Faucet & Install Shelf"
                        name="title"
                        value={offerData.title}
                        onChange={handleChange}
                    />

                    <TextField
                        fullWidth
                        label="Your Offer Price *"
                        name="price"
                        type="number"
                        value={offerData.price}
                        onChange={handleChange}
                        InputProps={{
                            startAdornment: <InputAdornment position="start"><AttachMoney /></InputAdornment>,
                        }}
                    />

                    <TextField
                        fullWidth
                        multiline
                        rows={4}
                        label="Description"
                        placeholder="Detailed explanation of the work required..."
                        name="description"
                        value={offerData.description}
                        onChange={handleChange}
                    />

                    <Button
                        variant="outlined"
                        component="label"
                        startIcon={<ImageIcon />}
                        sx={{ borderStyle: 'dashed', borderRadius: '8px', py: 2, color: '#64748b', borderColor: '#cbd5e1' }}
                    >
                        Upload Photos (Optional)
                        <input type="file" hidden multiple />
                    </Button>
                </Box>
            </DialogContent>

            <DialogActions sx={{ p: 3, borderTop: '1px solid #f1f5f9' }}>
                <Button onClick={onClose} sx={{ color: '#64748b' }}>Cancel</Button>
                <Button
                    variant="contained"
                    onClick={handleSubmit}
                    fullWidth
                    disabled={loading}
                    sx={{ bgcolor: '#10b981', fontWeight: 'bold', '&:hover': { bgcolor: '#059669' } }}
                >
                    {loading ? <CircularProgress size={24} color="inherit" /> : 'Submit Offer'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default MakeOfferModal;
