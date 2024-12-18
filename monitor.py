import sys
import start_system
import time


def monitor_docker_logs(container_name, follow=True):
    """
    Monitor the logs of a specified Docker container.
    :param container_name: Name of the Docker container to monitor.
    :param follow: Whether to follow the logs in real-time or not.
    """
    try:
        # Use the `docker logs` command with the `-f` option for real-time log monitoring
        log_command = f'docker logs {"-f" if follow else ""} {container_name}'
        
        print(f"Monitoring logs for container: {container_name}")
        print(log_command)
        
        while True:
            logs, _ = start_system.run_encoded_command(log_command)
            if logs:
                print(logs)
            time.sleep(1)  # Sleep briefly before checking again (optional)

    except KeyboardInterrupt:
        print("\nLog monitoring stopped.")
        sys.exit(0)
    except Exception as e:
        print("\nERROR : ")
        print(e)
        print("Please make sure you've run start_system.py and that docker is running on your system")
        sys.exit(0)

if __name__ == "__main__":
    # Check if enough arguments are provided in the terminal
    print(sys.argv)
    if len(sys.argv) == 3:
        # Use command-line arguments
        monitor_docker_logs(sys.argv[1])
    else:
        # Use default values
        print("No args detected, please enter name of docker to monitor")
        arg = input(":>> ")
        monitor_docker_logs(arg)