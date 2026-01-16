import React, { useState, useEffect } from 'react';
import {
    Box, Card, CardContent, Typography, TextField, Button, Grid,
    Divider, InputAdornment, Alert, CircularProgress, IconButton
} from '@mui/material';
import { Save, CloudUpload, Description, Receipt, AccountBalance, Email } from '@mui/icons-material';
import api from '../../../services/api';
import { useToast } from '../../ToastSystem';

const InvoiceSettings = () => {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [logoFile, setLogoFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState('');

    const [settings, setSettings] = useState({
        companyName: '',
        companyAddress: '',
        companyEmail: '',
        companyPhone: '',
        taxName: 'GST',
        taxRate: 18,
        terms: '',
        footerNote: ''
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const res = await api.get('/invoice-settings');
            if (res.data.success) {
                setSettings(res.data.settings);
                if (res.data.settings.logoUrl) {
                    setPreviewUrl(res.data.settings.logoUrl);
                }
            }
        } catch (err) {
            console.error(err);
            showToast('Failed to load settings', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setSettings({ ...settings, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setLogoFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const formData = new FormData();

            // Append all text fields
            Object.keys(settings).forEach(key => {
                formData.append(key, settings[key]);
            });

            // Append logo if changed
            if (logoFile) {
                formData.append('logo', logoFile);
            }

            const res = await api.post('/invoice-settings', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (res.data.success) {
                showToast('Settings saved successfully', 'success');
                setSettings(res.data.settings);
            }
        } catch (err) {
            console.error(err);
            showToast('Failed to save settings', 'error');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <Box p={4} textAlign="center"><CircularProgress /></Box>;

    return (
        <Box sx={{ maxWidth: 1200, margin: '0 auto', p: 3 }}>
            <Box mb={4} display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                    <Typography variant="h4" fontWeight="bold" gutterBottom>
                        Invoice Configuration
                    </Typography>
                    <Typography variant="body1" color="textSecondary">
                        Customize how your invoices look and feel. These settings apply to all auto-generated invoices.
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <Save />}
                    onClick={handleSave}
                    disabled={saving}
                    size="large"
                >
                    {saving ? 'Saving...' : 'Save Changes'}
                </Button>
            </Box>

            <Grid container spacing={4}>
                {/* Branding Section */}
                <Grid item xs={12} md={4}>
                    <Card sx={{ height: '100%', borderRadius: 3 }}>
                        <CardContent>
                            <Typography variant="h6" display="flex" alignItems="center" gap={1} mb={3}>
                                <Description color="primary" /> Branding & Logo
                            </Typography>

                            <Box
                                sx={{
                                    border: '2px dashed #ccc',
                                    borderRadius: 2,
                                    p: 3,
                                    textAlign: 'center',
                                    mb: 3,
                                    cursor: 'pointer',
                                    bgcolor: '#fafafa',
                                    '&:hover': { bgcolor: '#f0f0f0' }
                                }}
                                onClick={() => document.getElementById('logo-upload').click()}
                            >
                                {previewUrl ? (
                                    <Box component="img" src={previewUrl} alt="Logo" sx={{ maxWidth: '100%', maxHeight: 100, objectFit: 'contain' }} />
                                ) : (
                                    <Box py={2}>
                                        <CloudUpload sx={{ fontSize: 40, color: 'text.secondary' }} />
                                        <Typography variant="body2" color="textSecondary">
                                            Click to Upload Logo
                                        </Typography>
                                    </Box>
                                )}
                                <input
                                    type="file"
                                    id="logo-upload"
                                    hidden
                                    accept="image/*"
                                    onChange={handleFileChange}
                                />
                            </Box>

                            <TextField
                                fullWidth
                                label="Company Name"
                                name="companyName"
                                value={settings.companyName}
                                onChange={handleChange}
                                margin="normal"
                                variant="outlined"
                            />
                            <TextField
                                fullWidth
                                label="Support Email"
                                name="companyEmail"
                                value={settings.companyEmail}
                                onChange={handleChange}
                                margin="normal"
                                InputProps={{
                                    startAdornment: <InputAdornment position="start"><Email /></InputAdornment>,
                                }}
                            />
                        </CardContent>
                    </Card>
                </Grid>

                {/* Company Details */}
                <Grid item xs={12} md={8}>
                    <Card sx={{ height: '100%', borderRadius: 3 }}>
                        <CardContent>
                            <Typography variant="h6" display="flex" alignItems="center" gap={1} mb={3}>
                                <AccountBalance color="primary" /> Business Details
                            </Typography>

                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Company Address"
                                        name="companyAddress"
                                        multiline
                                        rows={3}
                                        value={settings.companyAddress}
                                        onChange={handleChange}
                                        placeholder="Full address including country and pincode"
                                    />
                                </Grid>

                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Tax Name (e.g. GST, VAT)"
                                        name="taxName"
                                        value={settings.taxName}
                                        onChange={handleChange}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Tax Rate (%)"
                                        name="taxRate"
                                        type="number"
                                        value={settings.taxRate}
                                        onChange={handleChange}
                                        InputProps={{
                                            endAdornment: <InputAdornment position="end">%</InputAdornment>,
                                        }}
                                    />
                                </Grid>
                            </Grid>

                            <Divider sx={{ my: 3 }} />

                            <Typography variant="h6" display="flex" alignItems="center" gap={1} mb={3}>
                                <Receipt color="primary" /> Footer information
                            </Typography>

                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Terms & Conditions"
                                        name="terms"
                                        multiline
                                        rows={4}
                                        value={settings.terms}
                                        onChange={handleChange}
                                        placeholder="e.g. Payment due in 30 days..."
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Footer Note"
                                        name="footerNote"
                                        value={settings.footerNote}
                                        onChange={handleChange}
                                        placeholder="e.g. Thank you for your business!"
                                    />
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
};

export default InvoiceSettings;
