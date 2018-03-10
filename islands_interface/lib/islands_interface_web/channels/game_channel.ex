defmodule IslandsInterfaceWeb.GameChannel do
  use IslandsInterfaceWeb, :channel

  alias IslandsEngine.{Game, GameSupervisor}

  def join("game:" <> _player, _payload, socket) do
    {:ok, socket}
  end

  def handle_in("hello", payload, socket) do
    broadcast! socket, "said_hello", payload
    {:noreply, socket}
  end

  def handle_in("new_game", _payload, socket) do
    "game:" <> player = socket.topic
    case GameSupervisor.start_game(player) do
      {:ok, _pid} -> {:reply, :ok, socket}
      {:error, reason} -> {:reply, {:error, %{reason: inspect(reason)}}, socket}
    end
  end

  def handle_in("add_player", player, socket) do
    case Game.add_player(via(socket.topic), player) do
      :ok ->
        broadcast! socket, "player_added", %{message: "New player just joined: " <> player}
        {:noreply, socket}
      {:error, reason} ->
        {:reply, {:error, %{reason: inspect(reason)}}, socket}
      :error ->
        {:reply, :error, socket}
    end
  end

  def handle_in(
    "position_island",
    %{"player" => player, "island" => island, "row" => row, "col" => col},
    socket
  ) do
    player = String.to_existing_atom(player)
    island = String.to_existing_atom(island)

    case Game.position_island(via(socket.topic), player, island, row, col) do
      :ok -> {:reply, :ok, socket}
      _ -> {:reply, :error, socket}
    end
  end

  ## Helpers

  ## Implementations

  defp via("game:" <> player), do: Game.via_tuple(player)
end
