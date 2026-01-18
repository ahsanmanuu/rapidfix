import React from 'react';
import {
    Dialog, DialogContent, Box, Typography, Button, IconButton, Chip
} from '@mui/material';
import { Close, ContentCopy, CheckCircle } from '@mui/icons-material';

const ClaimOfferModal = ({ open, onClose, offer }) => {
    if (!offer) return null;

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs" PaperProps={{ sx: { borderRadius: '24px', overflow: 'hidden' } }}>
            <Box sx={{ position: 'relative', height: 160 }}>
                <Box component="img" src={offer.image} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' }} />
                <IconButton onClick={onClose} sx={{ position: 'absolute', top: 8, right: 8, bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } }}>
                    <Close />
                </IconButton>
                <Box sx={{ position: 'absolute', bottom: 16, left: 16 }}>
                    <Chip label="LIMITED TIME" size="small" sx={{ bgcolor: '#fff', color: '#0f172a', fontWeight: 'bold', mb: 1 }} />
                    <Typography variant="h5" fontWeight="bold" sx={{ color: '#fff' }}>{offer.title}</Typography>
                </Box>
            </Box>

            <DialogContent sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="body2" sx={{ color: '#64748b', mb: 3 }}>
                    Use the code below at checkout to redeem your <b>{offer.discount}</b> discount.
                </Typography>

                <Box sx={{ mb: 3, p: 2, bgcolor: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="h6" fontFamily="monospace" fontWeight="bold" sx={{ letterSpacing: 2 }}>{offer.code}</Typography>
                    <Button size="small" startIcon={<ContentCopy />} sx={{ textTransform: 'none' }}>Copy</Button>
                </Box>

                <Button fullWidth variant="contained" size="large" sx={{ bgcolor: '#447aee', fontWeight: 'bold', borderRadius: '12px', py: 1.5 }}>
                    Book Now
                </Button>
            </DialogContent>
        </Dialog>
    );
};

export default ClaimOfferModal;
