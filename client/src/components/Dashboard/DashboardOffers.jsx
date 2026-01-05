import { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Box, Chip, List, ListItem, ListItemText, Divider } from '@mui/material';
import { Campaign, LocalOffer } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { getOffers } from '../../services/api';

const DashboardOffers = () => {
    const theme = useTheme();
    const [offers, setOffers] = useState([]);

    useEffect(() => {
        fetchOffers();
    }, []);

    const fetchOffers = async () => {
        try {
            const res = await getOffers();
            if (res.data.success) {
                setOffers(res.data.offers);
            }
        } catch (error) {
            console.error("Failed to fetch offers", error);
        }
    };

    if (offers.length === 0) return null;

    return (
        <Card sx={{ borderRadius: '16px', mb: 3, background: 'linear-gradient(135deg, #fff8e1 0%, #ffffff 100%)', border: '1px solid #ffe0b2' }}>
            <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Campaign sx={{ mr: 1, fontSize: 30, color: '#000' }} />
                    <Typography variant="h3" sx={{ color: '#000' }}>Notice Board & Offers</Typography>
                </Box>
                <List>
                    {offers.map((offer, index) => (
                        <Box key={offer.id}>
                            <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                                <LocalOffer sx={{ color: '#000', mr: 2, mt: 0.5 }} />
                                <ListItemText
                                    primary={
                                        <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                                            <Typography variant="h4">{offer.title}</Typography>
                                            {offer.badgeText && (
                                                <Chip
                                                    label={offer.badgeText}
                                                    size="small"
                                                    sx={{
                                                        bgcolor: theme.palette.error.main,
                                                        color: '#fff',
                                                        fontSize: '0.7rem',
                                                        fontWeight: 'bold',
                                                        height: 20
                                                    }}
                                                />
                                            )}
                                        </Box>
                                    }
                                    secondary={
                                        <Typography variant="body1" color="textSecondary" sx={{ mt: 0.5 }}>
                                            {offer.description}
                                        </Typography>
                                    }
                                />
                            </ListItem>
                            {index < offers.length - 1 && <Divider component="li" />}
                        </Box>
                    ))}
                </List>
            </CardContent>
        </Card>
    );
};

export default DashboardOffers;
