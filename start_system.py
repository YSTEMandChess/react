import subprocess
import traceback
import sys
import start_system

debug_mode = True

# Creating network dockers will communicate over
network_name = "ystem-network"
network_command = f"docker network create {network_name}"


# To run commands in a way compatible with DOCKER
def run_encoded_command(command, timeout=300):  # Increased timeout to 5 minutes for Docker commands
    try:
        # Use subprocess.Popen to capture output with explicit encoding
        process = subprocess.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE, shell=True, encoding="utf-8")
        stdout, stderr = process.communicate(timeout=timeout)  # Set a timeout to avoid hanging

        # Return the output and return code
        return_code = process.returncode

        if return_code != 0:
            # If there's an error, print the error and return the result as a tuple
            print("Error:", stderr)
            return stderr, return_code
        else:
            return stdout, return_code

    except subprocess.TimeoutExpired:
        process.kill()  # Ensure process is killed after timeout
        stdout, stderr = process.communicate()
        print("Process timed out!")
        return stderr, 1
    except Exception as e:
        print("Exception occurred:", e)
        return str(e), 1  # Return the exception message and a non-zero return code


# Removes, Builds, and Starts specified docker
def start_docker_image(location, running_name, image_name, local_port, container_port):
    results = []
    commands = []

    try:
        # Deleting the docker, if it is already running/compiled
        print("removing if already present")

        # Use platform-independent approach
        new_command = f'docker rm -f {running_name}'  # This will force remove any running container
        commands.append(new_command)

        result = run_encoded_command(new_command)
        results.append(result)

        # If there was an error in removing the container, stop further execution
        if result[1] != 0:
            print("Error removing container. Aborting further operations.")
            return results  # Exit early if there's a failure

        # Building the docker
        print("building docker")
        new_command = f'docker build -t {image_name} {location}'  # Build directly in the given location
        commands.append(new_command)

        result = run_encoded_command(new_command)
        results.append(result)

        # If there was an error in building the Docker image, stop further execution
        if result[1] != 0:
            print("Error building Docker image. Aborting further operations.")
            return results  # Exit early if there's a failure

        # Starting the docker
        print("running docker")
        new_command = f'docker run -d --network {network_name} -p {local_port}:{container_port} --name {running_name} {image_name}'  # Run in detached mode
        commands.append(new_command)

        result = run_encoded_command(new_command)
        results.append(result)

    except Exception as e:
        traceback.print_exc()
        print("Error:", e)
        if debug_mode:
            sys.exit()

    finally:
        print(f"\nRESULTS from: {location} {running_name} {image_name}")
        for i in range(len(results)):
            # Print the output of the command
            print("Input:", commands[i])
            print("Output:", results[i][0])
            print("Exit code:", results[i][1])

    return results[-1]  # Return the last result

if __name__ == "__main__":
    # Instantiating network 
    print("Creating docker network")
    run_encoded_command(network_command)
    
    # Compiling and starting transit UPDATER docker
    
    print("stating account database")
    start_docker_image("account-db", "account-db-container", "account-db", 5000, 5000)

    print("starting account API node.js")
    start_docker_image("account-api", "account-api-container", "account-api", 4000, 4000)

    print("starting login manager node.js")
    start_docker_image("login-manager", "login-manager-container", "login-manager", 3000, 3000)