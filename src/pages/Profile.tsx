import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { MessageCircle, Edit, Save, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Profile {
  id: string;
  full_name: string;
  role: string;
  location: string | null;
  phone: string | null;
  bio: string | null;
  crop_types: string[];
  business_type: string | null;
}

const Profile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [editedProfile, setEditedProfile] = useState<Partial<Profile>>({});
  const [cropInput, setCropInput] = useState("");

  useEffect(() => {
    fetchProfile();
    checkIfOwnProfile();
  }, [userId]);

  const checkIfOwnProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setIsOwnProfile(user?.id === userId);
  };

  const fetchProfile = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      toast({ title: "Error loading profile", variant: "destructive" });
    } else {
      setProfile(data);
      setEditedProfile(data);
    }
  };

  const saveProfile = async () => {
    const updateData: any = { ...editedProfile };
    delete updateData.id;
    delete updateData.role;
    delete updateData.created_at;
    delete updateData.updated_at;

    const { error } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("id", userId);

    if (error) {
      toast({ title: "Error updating profile", variant: "destructive" });
    } else {
      toast({ title: "Profile updated successfully" });
      setIsEditing(false);
      fetchProfile();
    }
  };

  const addCropType = () => {
    if (cropInput.trim()) {
      const newCrops = [...(editedProfile.crop_types || []), cropInput.trim()];
      setEditedProfile({ ...editedProfile, crop_types: newCrops });
      setCropInput("");
    }
  };

  const removeCropType = (index: number) => {
    const newCrops = (editedProfile.crop_types || []).filter((_, i) => i !== index);
    setEditedProfile({ ...editedProfile, crop_types: newCrops });
  };

  const startConversation = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !userId) return;

    const participant1 = user.id < userId ? user.id : userId;
    const participant2 = user.id < userId ? userId : user.id;

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

  if (!profile) return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-foreground">Profile</h1>
          <Button onClick={() => navigate("/dashboard")} variant="outline">
            Back to Dashboard
          </Button>
        </div>

        <Card className="border-primary/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                    {profile.full_name[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-2xl">{profile.full_name}</CardTitle>
                  <Badge className="capitalize mt-2">{profile.role}</Badge>
                </div>
              </div>
              <div className="flex gap-2">
                {!isOwnProfile && (
                  <Button onClick={startConversation}>
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Message
                  </Button>
                )}
                {isOwnProfile && (
                  <>
                    {!isEditing ? (
                      <Button onClick={() => setIsEditing(true)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Profile
                      </Button>
                    ) : (
                      <>
                        <Button onClick={saveProfile}>
                          <Save className="mr-2 h-4 w-4" />
                          Save
                        </Button>
                        <Button onClick={() => setIsEditing(false)} variant="outline">
                          <X className="mr-2 h-4 w-4" />
                          Cancel
                        </Button>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditing ? (
              <>
                <div>
                  <label className="text-sm font-medium">Full Name</label>
                  <Input
                    value={editedProfile.full_name || ""}
                    onChange={(e) => setEditedProfile({ ...editedProfile, full_name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Location</label>
                  <Input
                    value={editedProfile.location || ""}
                    onChange={(e) => setEditedProfile({ ...editedProfile, location: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Phone</label>
                  <Input
                    value={editedProfile.phone || ""}
                    onChange={(e) => setEditedProfile({ ...editedProfile, phone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Bio</label>
                  <Textarea
                    value={editedProfile.bio || ""}
                    onChange={(e) => setEditedProfile({ ...editedProfile, bio: e.target.value })}
                    className="min-h-[100px]"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Business Type</label>
                  <Input
                    value={editedProfile.business_type || ""}
                    onChange={(e) => setEditedProfile({ ...editedProfile, business_type: e.target.value })}
                    placeholder="e.g., Organic Farming, Dairy, Wholesale Distributor"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Crop Types</label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={cropInput}
                      onChange={(e) => setCropInput(e.target.value)}
                      placeholder="Add crop type"
                      onKeyPress={(e) => e.key === "Enter" && addCropType()}
                    />
                    <Button onClick={addCropType} size="sm">Add</Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {editedProfile.crop_types?.map((crop, index) => (
                      <Badge key={index} variant="secondary" className="cursor-pointer" onClick={() => removeCropType(index)}>
                        {crop} <X className="ml-1 h-3 w-3" />
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <>
                {profile.location && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Location</p>
                    <p className="text-foreground">{profile.location}</p>
                  </div>
                )}
                {profile.phone && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Phone</p>
                    <p className="text-foreground">{profile.phone}</p>
                  </div>
                )}
                {profile.bio && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Bio</p>
                    <p className="text-foreground whitespace-pre-wrap">{profile.bio}</p>
                  </div>
                )}
                {profile.business_type && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Business Type</p>
                    <p className="text-foreground">{profile.business_type}</p>
                  </div>
                )}
                {profile.crop_types && profile.crop_types.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Crop Types</p>
                    <div className="flex flex-wrap gap-2">
                      {profile.crop_types.map((crop, index) => (
                        <Badge key={index} variant="secondary">{crop}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;