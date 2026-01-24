import { useState } from 'react';
import api from '../../services/api';
import {
    Card,
    CardContent,
    TextField,
    Button,
    Typography,
    Box,
    Avatar,
    Grid,
    InputAdornment
} from '@mui/material';
import { Person, Email, Phone, Lock, Save, CameraAlt, LocationOn } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useAuth } from '../../context/AuthContext';

const DashboardProfile = () => {
    const { user, updateUser } = useAuth();
    const theme = useTheme();
    const [formData, setFormData] = useState({
        name: user.name,
        photo: user.photo || '',
        password: ''
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const updates = {};
            if (formData.name !== user.name) updates.name = formData.name;
            if (formData.photo !== user.photo) updates.photo = formData.photo;
            if (formData.password) updates.password = formData.password;

            if (Object.keys(updates).length > 0) {
                const res = await api.put(`/users/${user.id}`, updates);
                if (res.data.success) {
                    alert('Profile updated!');
                    updateUser(res.data.user);
                }
            }
        } catch (error) {
            console.error(error);
            alert('Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateLocation = () => {
        if (!navigator.geolocation) {
            alert('Geolocation is not supported by your browser');
            return;
        }

        setLoading(true);
        navigator.geolocation.getCurrentPosition(async (position) => {
            try {
                // We send coordinates, and backend will reverse geocode or store them.
                // Our backend `updateUser` now supports { location: { latitude, longitude } }
                const location = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                    // We can also send 'address' if we want to reverse geocode on frontend, 
                    // but let's let the backend doing it if we send a string, or we send coords and it saves them.
                    // Actually `UserManager.updateUser` handles { location: {latitude, longitude} } fine 
                    // but doesn't auto-reverse geocode coords to address unless we send a string.
                    // For better UX, let's keep the frontend reverse geocode OR trust a new backend helper?
                    // Let's keep the existing frontend reverse geocode for immediate UI feedback if possible,
                    // OR just rely on the existing logic which was working?
                    // The existing logic was calling nominatim directly. That's fine.
                    // I will just make sure we send the data in the format `updateUser` expects now.
                };

                // Perform simplified reverse geocode for display purposed before verify
                let addressText = "Detected Location";
                try {
                    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}`);
                    const data = await response.json();
                    if (data && data.display_name) {
                        addressText = data.display_name;
                        location.address = addressText;
                    }
                } catch (e) { console.warn("Reverse geo failed", e); }

                // Send as "location" object which `updateUser` intercepts
                const res = await api.put(`/users/${user.id}`, { location });

                if (res.data.success || res.config) { // Axios sometimes returns data directly? usually res.data
                    alert('Location updated successfully!');
                    // Update context with new user data including location
                    // The backend returns the updated user object
                    if (res.data.user) updateUser(res.data.user);
                    else updateUser({ ...user, ...res.data });
                }
            } catch (error) {
                console.error("Location update failed", error);
                alert('Failed to update location');
            } finally {
                setLoading(false);
            }
        }, (error) => {
            console.error("Geolocation error", error);
            alert('Unable to retrieve your location. Please check browser permissions.');
            setLoading(false);
        });
    };

    return (
        <Grid container spacing={3} justifyContent="center" alignItems="center" sx={{ minHeight: 'calc(100vh - 150px)' }}>
            <Grid item xs={12} md={8} lg={6}>
                <Card sx={{ borderRadius: '16px', border: `1px solid ${theme.palette.divider}`, boxShadow: theme.shadows[3] }}>
                    <CardContent sx={{ p: 3 }}>
                        <Typography variant="h5" sx={{ mb: 3, textAlign: 'center', fontWeight: 'bold' }}>Profile Settings</Typography>

                        <form onSubmit={handleSubmit}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4 }}>
                                <Box sx={{ position: 'relative' }}>
                                    <Avatar
                                        src={formData.photo}
                                        sx={{
                                            width: 80,
                                            height: 80,
                                            border: `4px solid ${theme.palette.primary.light}`,
                                            bgcolor: theme.palette.grey[200]
                                        }}
                                    >
                                        <Person sx={{ fontSize: 40, color: theme.palette.grey[400] }} />
                                    </Avatar>
                                    <Box
                                        sx={{
                                            position: 'absolute',
                                            bottom: 0,
                                            right: 0,
                                            bgcolor: theme.palette.primary.main,
                                            borderRadius: '50%',
                                            p: 0.5,
                                            border: '2px solid white',
                                            display: 'flex',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <CameraAlt sx={{ color: 'white', fontSize: 16 }} />
                                    </Box>
                                </Box>
                                <TextField
                                    variant="standard"
                                    placeholder="Photo URL"
                                    value={formData.photo}
                                    onChange={e => setFormData({ ...formData, photo: e.target.value })}
                                    sx={{ mt: 2, width: '100%', maxWidth: 300, textAlign: 'center' }}
                                    inputProps={{ style: { textAlign: 'center' } }}
                                />
                            </Box>

                            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                                <Button
                                    variant="outlined"
                                    startIcon={<LocationOn />}
                                    onClick={handleUpdateLocation}
                                    color="info"
                                    disabled={loading}
                                >
                                    Update My Location
                                </Button>
                            </Box>

                            <Grid container spacing={3}>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Full Name"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <Person color="action" />
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        label="Email Address"
                                        value={user.email}
                                        disabled
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <Email color="disabled" />
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        label="Phone Number"
                                        value={user.phone}
                                        disabled
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <Phone color="disabled" />
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="New Password"
                                        type="password"
                                        value={formData.password}
                                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                                        placeholder="Leave empty to keep current"
                                        helperText="Min. 6 characters"
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <Lock color="action" />
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                </Grid>

                                <Grid item xs={12} sx={{ mt: 2 }}>
                                    <Button
                                        type="submit"
                                        variant="contained"
                                        size="large"
                                        fullWidth
                                        disabled={loading}
                                        startIcon={<Save />}
                                        sx={{ borderRadius: '12px', height: 50 }}
                                    >
                                        {loading ? 'Saving Changes...' : 'Save Profile'}
                                    </Button>
                                </Grid>
                            </Grid>
                        </form>
                    </CardContent>
                </Card>
            </Grid>
        </Grid>
    );
};

export default DashboardProfile;
