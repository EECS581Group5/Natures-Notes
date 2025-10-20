import { useState } from "react";

function UserForm() {
    const [location, setLocation] = useState("");

    function handleSubmit(e) {
        e.preventDefault(); //Prevents page refresh
        alert(`Your Location is: ${location}`);

    }

    return (
        <form onSubmit={handleSubmit}>
            <label>
                Location:
                <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                />
            </label>
            <button type="submit">Submit</button>
        </form>
    );
}

export default UserForm;