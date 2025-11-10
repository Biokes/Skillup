const PORT = process.env.PORT || 3000;

export async function selfPing() {
    try {
        const response = await fetch(`http://localhost:${PORT}/api/v1`);
        if (response.ok) {
            const result = await response.json();
            console.log(`[Ping] SUCCESS! Response: ${result.message}`);
        } else {
            console.error(`[Ping] FAILED! Status: ${response.status} ${response.statusText}`);
        }
    } catch (error) {
        console.error(`[Ping] ERROR during self-ping:`, (error as Error).message);
    }
}

