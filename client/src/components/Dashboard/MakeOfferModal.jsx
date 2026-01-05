import { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    Grid,
    MenuItem,
    Typography,
    InputAdornment,
    Box
} from '@mui/material';
import { createJob } from '../../services/api';

const MakeOfferModal = ({ open, onClose, user, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        serviceType: 'Electrician',
        description: '',
        offerPrice: '',
        contactName: user?.name || '',
        contactPhone: user?.phone || '',
        location: user?.location ? 'Current Location' : '' // Simplify for now
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const jobData = {
                userId: user.id,
                ...formData,
                location: user.location || { latitude: 0, longitude: 0 }, // Fallback
                offerPrice: parseFloat(formData.offerPrice)
            };

            await createJob(jobData);
            setLoading(false);
            onSuccess();
            onClose();
            // Reset form (optional)
            setFormData({
                serviceType: 'Electrician',
                description: '',
                offerPrice: '',
                contactName: user?.name || '',
                contactPhone: user?.phone || '',
                location: user?.location ? 'Current Location' : ''
            });
        } catch (error) {
            console.error(error);
            alert('Failed to submit offer');
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
            <DialogTitle>
                <Typography variant="h3">Make an Offer</Typography>
                <Typography variant="body2" color="textSecondary">Post a custom job with your budget.</Typography>
            </DialogTitle>
            <DialogContent dividers>
                <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                select
                                fullWidth
                                label="Service Type"
                                name="serviceType"
                                value={formData.serviceType}
                                onChange={handleChange}
                            >
                                {['Electrician', 'Plumber', 'AC Technician', 'Painter', 'Carpenter', 'CCTV Technician', 'Biometrics Technician'].map((option) => (
                                    <MenuItem key={option} value={option}>
                                        {option}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Your Offer Price (₹)"
                                name="offerPrice"
                                type="number"
                                value={formData.offerPrice}
                                onChange={handleChange}
                                required
                                InputProps={{
                                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                                }}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                multiline
                                rows={3}
                                label="Job Description"
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                required
                                placeholder="Describe the work in detail..."
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Contact Name"
                                name="contactName"
                                value={formData.contactName}
                                onChange={handleChange}
                                required
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Contact Phone"
                                name="contactPhone"
                                value={formData.contactPhone}
                                onChange={handleChange}
                                required
                            />
                        </Grid>
                    </Grid>
                </Box>
            </DialogContent>
            <DialogActions sx={{ p: 3 }}>
                <Button onClick={onClose} color="inherit" size="large" sx={{ borderRadius: '12px' }}>
                    Cancel
                </Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    color="secondary"
                    size="large"
                    disabled={loading}
                    sx={{ borderRadius: '12px', px: 4 }}
                >
                    {loading ? 'Posting...' : 'Post Offer'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default MakeOfferModal;
