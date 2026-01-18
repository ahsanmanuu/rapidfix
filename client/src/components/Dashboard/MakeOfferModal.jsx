import React, { useState } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, TextField, Box, Typography, IconButton, InputAdornment
} from '@mui/material';
import { Close, AttachMoney, Image as ImageIcon } from '@mui/icons-material';

const MakeOfferModal = ({ open, onClose }) => {
    const [offerData, setOfferData] = useState({
        title: '',
        price: '',
        description: '',
        photos: []
    });

    const handleChange = (e) => {
        setOfferData({ ...offerData, [e.target.name]: e.target.value });
    };

    const handleSubmit = () => {
        alert(`Offer Submitted!\nTitle: ${offerData.title}\nPrice: $${offerData.price}`);
        onClose();
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: '16px' } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, borderBottom: '1px solid #f1f5f9' }}>
                <Typography variant="h6" fontWeight="bold">Make an Offer</Typography>
                <IconButton onClick={onClose} size="small"><Close /></IconButton>
            </Box>

            <DialogContent sx={{ p: 3 }}>
                <Typography variant="body2" sx={{ color: '#64748b', mb: 3 }}>
                    Describe your custom job and propose a price. Technicians can accept or counter your offer.
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <TextField
                        fullWidth
                        label="Job Title"
                        placeholder="e.g., Fix Leaky Faucet & Install Shelf"
                        name="title"
                        value={offerData.title}
                        onChange={handleChange}
                    />

                    <TextField
                        fullWidth
                        label="Your Offer Price"
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
                <Button variant="contained" onClick={handleSubmit} fullWidth sx={{ bgcolor: '#10b981', fontWeight: 'bold', '&:hover': { bgcolor: '#059669' } }}>
                    Submit Offer
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default MakeOfferModal;
