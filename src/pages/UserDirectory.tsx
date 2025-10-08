import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Search, MessageCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Profile {
  id: string;
  full_name: string;
  role: string;
  location: string | null;
  bio: string | null;
  crop_types: string[];
  business_type: string | null;
}

const UserDirectory = () => {
  const [users, setUsers] = useState<Profile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<Profile[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [locationFilter, setLocationFilter] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCurrentUser();
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [searchTerm, roleFilter, locationFilter, users]);

  const fetchCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUserId(user?.id || null);
  };

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("full_name");

    if (error) {
      toast({ title: "Error fetching users", variant: "destructive" });
    } else {
      const filtered = data?.filter(user => user.id !== currentUserId) || [];
      setUsers(filtered);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    if (searchTerm) {
      filtered = filtered.filter(
        (user) =>
          user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.business_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.crop_types?.some(crop => crop.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (roleFilter !== "all") {
      filtered = filtered.filter((user) => user.role === roleFilter);
    }

    if (locationFilter) {
      filtered = filtered.filter((user) =>
        user.location?.toLowerCase().includes(locationFilter.toLowerCase())
      );
    }

    setFilteredUsers(filtered);
  };

  const startConversation = async (userId: string) => {
    if (!currentUserId) return;

    const participant1 = currentUserId < userId ? currentUserId : userId;
    const participant2 = currentUserId < userId ? userId : currentUserId;

    const { data: existing } = await supabase
      .from("conversations")
      .select("id")
      .eq("participant1_id", participant1)
      .eq("participant2_id", participant2)
      .maybeSingle();

    if (existing) {
      navigate(`/messages?conversation=${existing.id}`);
    } else {
      const { data: newConv, error } = await supabase
        .from("conversations")
        .insert({ participant1_id: participant1, participant2_id: participant2 })
        .select()
        .single();

      if (error) {
        toast({ title: "Error starting conversation", variant: "destructive" });
      } else {
        navigate(`/messages?conversation=${newConv.id}`);
      }
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-foreground">User Directory</h1>
          <Button onClick={() => navigate("/dashboard")} variant="outline">
            Back to Dashboard
          </Button>
        </div>

        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="text-primary">Search & Filter</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search by name, crop type, or business..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="w-48">
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="farmer">Farmer</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="wholesaler">Wholesaler</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-48">
                <Input
                  placeholder="Filter by location"
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUsers.map((user) => (
            <Card key={user.id} className="border-primary/10 hover:border-primary/30 transition-colors">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <Avatar 
                    className="h-16 w-16 cursor-pointer"
                    onClick={() => navigate(`/profile/${user.id}`)}
                  >
                    <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                      {user.full_name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 
                      className="font-semibold text-foreground cursor-pointer hover:text-primary truncate"
                      onClick={() => navigate(`/profile/${user.id}`)}
                    >
                      {user.full_name}
                    </h3>
                    <Badge className="capitalize mt-1">{user.role}</Badge>
                    {user.location && (
                      <p className="text-sm text-muted-foreground mt-2">{user.location}</p>
                    )}
                    {user.business_type && (
                      <p className="text-sm text-muted-foreground mt-1">{user.business_type}</p>
                    )}
                    {user.bio && (
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{user.bio}</p>
                    )}
                    {user.crop_types && user.crop_types.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {user.crop_types.slice(0, 3).map((crop, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {crop}
                          </Badge>
                        ))}
                        {user.crop_types.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{user.crop_types.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                    <div className="flex gap-2 mt-4">
                      <Button
                        size="sm"
                        onClick={() => navigate(`/profile/${user.id}`)}
                        variant="outline"
                        className="flex-1"
                      >
                        View Profile
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => startConversation(user.id)}
                        className="flex-1"
                      >
                        <MessageCircle className="mr-1 h-3 w-3" />
                        Message
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredUsers.length === 0 && (
          <Card className="border-primary/10">
            <CardContent className="py-12 text-center">
              <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No users found matching your criteria</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default UserDirectory;